import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const allowedCompletionStatuses = new Set([
  "in_progress",
  "completed",
  "abandoned",
  "contact_submitted"
]);
const allowedEventTypes = new Set([
  "session_started",
  "session_summary_ready",
  "contact_submitted",
  "package_selected"
]);

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => asString(item)).filter(Boolean) as string[]));
  }
  const single = asString(value);
  return single ? [single] : [];
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function normalizeCompletionStatus(value: unknown): string {
  const normalized = asString(value) || "in_progress";
  return allowedCompletionStatuses.has(normalized) ? normalized : "in_progress";
}

function inferPriority(eventType: string): "normal" | "high" {
  return eventType === "contact_submitted" || eventType === "package_selected" ? "high" : "normal";
}

function transcriptSnapshot(transcript: unknown): string | null {
  if (!Array.isArray(transcript)) return null;
  const lines = transcript
    .map((entry) => {
      const row = asObject(entry);
      const role = asString(row.role) || "unknown";
      const content = asString(row.content) || "";
      return `${role}: ${content}`;
    })
    .filter((line) => line.trim())
    .slice(-8);
  return lines.length ? lines.join("\n") : null;
}

async function replaceRows(
  supabase: ReturnType<typeof createClient>,
  table: string,
  sessionId: string,
  rows: Record<string, unknown>[]
) {
  const deleteResult = await supabase.from(table).delete().eq("session_id", sessionId);
  if (deleteResult.error) throw deleteResult.error;
  if (!rows.length) return;
  const insertResult = await supabase.from(table).insert(rows);
  if (insertResult.error) throw insertResult.error;
}

function buildSummaryCard(params: {
  eventType: string;
  priority: "normal" | "high";
  capturedAt: string;
  rawSession: Record<string, unknown>;
  normalizedFeatures: Record<string, unknown>;
  contactDetails: Record<string, unknown>;
  productLearning: Record<string, unknown>;
}) {
  const { eventType, priority, capturedAt, rawSession, normalizedFeatures, contactDetails, productLearning } = params;
  return {
    event_type: eventType,
    priority,
    timestamp: capturedAt,
    session_id: asString(rawSession.session_id),
    client_session_id: asString(rawSession.session_id),
    source: asString(rawSession.source),
    channel: asString(rawSession.channel),
    page_url: asString(rawSession.page_url),
    build_version: asString(rawSession.build_version),
    completion_status: asString(rawSession.completion_status),
    business_type: asString(normalizedFeatures.primary_business_type),
    main_issue: asString(normalizedFeatures.primary_problem) || asString(asObject(rawSession.findings_json).main_issue),
    first_focus: asString(asObject(rawSession.findings_json).first_focus),
    summary: asString(asObject(rawSession.findings_json).summary),
    urgency_level: asString(normalizedFeatures.urgency_level),
    confidence_label: asString(rawSession.confidence_label),
    confidence_value: asNumber(rawSession.confidence),
    assessment_score: asNumber(rawSession.score),
    context_score: asNumber(rawSession.readiness_score),
    recommendations: rawSession.recommendations_json ?? normalizedFeatures.recommendation_ids ?? [],
    transcript_snapshot: transcriptSnapshot(rawSession.transcript),
    contact_submitted: asBoolean(rawSession.contact_submitted),
    package_selected: asString(contactDetails.package),
    name: asString(contactDetails.name),
    email: asString(contactDetails.email),
    company: asString(contactDetails.company),
    message: asString(contactDetails.message),
    operator_notes: {
      stage: asString(productLearning.last_completed_step),
      drop_off_step: asString(productLearning.drop_off_step),
      low_confidence: asBoolean(productLearning.low_confidence)
    }
  };
}

function renderSummaryCardText(summaryCard: Record<string, unknown>) {
  return [
    `Event: ${summaryCard.event_type ?? "unknown"}`,
    `Priority: ${summaryCard.priority ?? "normal"}`,
    `Timestamp: ${summaryCard.timestamp ?? ""}`,
    `Session ID: ${summaryCard.session_id ?? ""}`,
    `Client Session ID: ${summaryCard.client_session_id ?? ""}`,
    `Source: ${summaryCard.source ?? ""}`,
    `Channel: ${summaryCard.channel ?? ""}`,
    `Page URL: ${summaryCard.page_url ?? ""}`,
    `Build Version: ${summaryCard.build_version ?? ""}`,
    `Completion Status: ${summaryCard.completion_status ?? ""}`,
    `Business Type: ${summaryCard.business_type ?? ""}`,
    `Main Issue: ${summaryCard.main_issue ?? ""}`,
    `First Focus: ${summaryCard.first_focus ?? ""}`,
    `Summary: ${summaryCard.summary ?? ""}`,
    `Urgency: ${summaryCard.urgency_level ?? ""}`,
    `Confidence: ${summaryCard.confidence_label ?? ""} (${summaryCard.confidence_value ?? ""})`,
    `Assessment Score: ${summaryCard.assessment_score ?? ""}`,
    `Context Score: ${summaryCard.context_score ?? ""}`,
    `Recommendations: ${JSON.stringify(summaryCard.recommendations ?? [])}`,
    `Contact Submitted: ${summaryCard.contact_submitted ? "yes" : "no"}`,
    `Package Selected: ${summaryCard.package_selected ?? ""}`,
    `Name: ${summaryCard.name ?? ""}`,
    `Email: ${summaryCard.email ?? ""}`,
    `Company: ${summaryCard.company ?? ""}`,
    `Message: ${summaryCard.message ?? ""}`,
    `Transcript Snapshot: ${summaryCard.transcript_snapshot ?? ""}`,
    `Operator Notes: ${JSON.stringify(summaryCard.operator_notes ?? {})}`
  ].join("\n");
}

async function deliverNotification(params: {
  eventId: string;
  eventType: string;
  priority: "normal" | "high";
  summaryCard: Record<string, unknown>;
  retryCount: number;
  maxRetryCount: number;
  supabase: ReturnType<typeof createClient>;
}) {
  const { eventId, eventType, priority, summaryCard, retryCount, maxRetryCount, supabase } = params;
  const emailTo = Deno.env.get("OC_NOTIFICATION_EMAIL_TO");
  const emailFrom = Deno.env.get("OC_NOTIFICATION_EMAIL_FROM");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const slackWebhookUrl = Deno.env.get("OC_NOTIFICATION_SLACK_WEBHOOK_URL");

  const errors: string[] = [];
  let emailSent = false;
  let slackSent = false;

  const subjectPrefix = priority === "high" ? "[HIGH PRIORITY] " : "";
  const subject = `${subjectPrefix}Operational Clarity ${eventType}`;
  const textBody = renderSummaryCardText(summaryCard);

  if (emailTo && emailFrom && resendApiKey) {
    const emailResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [emailTo],
        subject,
        text: textBody
      })
    });
    if (!emailResp.ok) {
      errors.push(`email ${emailResp.status}: ${await emailResp.text()}`);
    } else {
      emailSent = true;
    }
  }

  if (slackWebhookUrl) {
    const slackResp = await fetch(slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `*${subject}*\n\n\`\`\`${textBody}\`\`\`` })
    });
    if (!slackResp.ok) {
      errors.push(`slack ${slackResp.status}: ${await slackResp.text()}`);
    } else {
      slackSent = true;
    }
  }

  if (!emailSent && !slackSent) {
    if (!emailTo && !slackWebhookUrl) {
      errors.push("No delivery channel configured. Set email and/or Slack env vars.");
    }

    const failureUpdate = await supabase
      .from("oc_notification_events")
      .update({
        status: "failed",
        retry_count: Math.min(retryCount + 1, maxRetryCount),
        last_error: errors.join(" | "),
        delivery_channels: { email_sent: emailSent, slack_sent: slackSent }
      })
      .eq("id", eventId);

    if (failureUpdate.error) throw failureUpdate.error;
    return;
  }

  const sentUpdate = await supabase
    .from("oc_notification_events")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      last_error: null,
      delivery_channels: { email_sent: emailSent, slack_sent: slackSent }
    })
    .eq("id", eventId);

  if (sentUpdate.error) throw sentUpdate.error;
}

async function retryPendingNotifications(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  maxRetryCount: number
) {
  const pending = await supabase
    .from("oc_notification_events")
    .select("id, event_type, priority, summary_card, retry_count, status")
    .eq("session_id", sessionId)
    .in("status", ["pending", "failed"]);

  if (pending.error) throw pending.error;
  if (!pending.data?.length) return;

  for (const row of pending.data) {
    const retryCount = asNumber(row.retry_count) || 0;
    if (retryCount >= maxRetryCount) continue;

    await deliverNotification({
      eventId: String(row.id),
      eventType: String(row.event_type),
      priority: String(row.priority) === "high" ? "high" : "normal",
      summaryCard: asObject(row.summary_card),
      retryCount,
      maxRetryCount,
      supabase
    });
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: "Supabase environment variables are missing." });
  }

  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch (_error) {
    return jsonResponse(400, { error: "Request body must be valid JSON." });
  }

  const rawSession = asObject(payload.raw_session || payload.session || payload);
  const normalizedFeatures = asObject(payload.normalized_features);
  const productLearning = asObject(payload.product_learning);
  const contactDetails = asObject(payload.contact_details);
  const pendingNotificationEvents = Array.isArray(payload.pending_notification_events)
    ? payload.pending_notification_events.map((value) => asObject(value)).filter((value) => allowedEventTypes.has(asString(value.event_type) || ""))
    : [];

  const clientSessionId = asString(rawSession.session_id);
  if (!clientSessionId) {
    return jsonResponse(400, { error: "raw_session.session_id is required." });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
  const maxRetryCount = Math.max(1, Number(Deno.env.get("OC_NOTIFICATION_MAX_RETRY") || 5));

  try {
    const existingSession = await supabase
      .from("oc_sessions")
      .select("id, completion_status, contact_submitted, notes")
      .eq("client_session_id", clientSessionId)
      .maybeSingle();

    if (existingSession.error) throw existingSession.error;

    const prior = existingSession.data;
    const priorNotes = asObject(prior?.notes);
    const priorContactDetails = asObject(priorNotes.contact_details);

    const completionStatus = normalizeCompletionStatus(rawSession.completion_status);
    const notesPayload = {
      schema_version: payload.schema_version ?? null,
      captured_at: payload.captured_at ?? null,
      contact_details: contactDetails,
      last_notification_event_sync_at: new Date().toISOString()
    };

    const sessionRow = {
      client_session_id: clientSessionId,
      created_at: asString(rawSession.created_at) || new Date().toISOString(),
      completed_at: asString(rawSession.completed_at),
      completion_status: completionStatus,
      transcript: Array.isArray(rawSession.transcript) ? rawSession.transcript : [],
      extracted_json: rawSession.extracted_json ?? {},
      findings_json: rawSession.findings_json ?? {},
      recommendations_json: rawSession.recommendations_json ?? [],
      assessment_score: asNumber(rawSession.score),
      context_score: asNumber(rawSession.readiness_score),
      confidence_label: asString(rawSession.confidence_label),
      confidence_value: asNumber(rawSession.confidence),
      buy_signal: asString(rawSession.buy_signal),
      buy_signal_score: asNumber(rawSession.buy_signal_score),
      contact_submitted: asBoolean(rawSession.contact_submitted),
      source: asString(rawSession.source),
      channel: asString(rawSession.channel),
      page_url: asString(rawSession.page_url),
      build_version: asString(rawSession.build_version),
      session_path: asStringArray(rawSession.session_path),
      branch_path: asStringArray(rawSession.branch_path),
      last_completed_step: asString(productLearning.last_completed_step),
      drop_off_step: asString(productLearning.drop_off_step),
      low_confidence: asBoolean(productLearning.low_confidence),
      extraction_confidence: asNumber(productLearning.extraction_confidence),
      stages_seen: asStringArray(productLearning.stages_seen),
      question_sequence: Array.isArray(productLearning.questions_appeared) ? productLearning.questions_appeared : [],
      surfaced_questions: Array.isArray(productLearning.questions_appeared) ? productLearning.questions_appeared : [],
      usefulness_feedback: productLearning.usefulness_feedback ?? null,
      product_learning_json: productLearning,
      normalized_snapshot: normalizedFeatures,
      notes: notesPayload
    };

    const upsertSession = await supabase
      .from("oc_sessions")
      .upsert(sessionRow, { onConflict: "client_session_id" })
      .select("id")
      .single();

    if (upsertSession.error || !upsertSession.data) {
      throw upsertSession.error || new Error("Failed to upsert session.");
    }

    const sessionId = upsertSession.data.id as string;
    const featureRow = {
      session_id: sessionId,
      primary_business_type: asString(normalizedFeatures.primary_business_type),
      secondary_business_type: asString(normalizedFeatures.secondary_business_type),
      sub_industry: asString(normalizedFeatures.sub_industry),
      business_model: asString(normalizedFeatures.business_model),
      business_model_tags: asStringArray(normalizedFeatures.business_model_tags),
      size_band: asString(normalizedFeatures.size_band),
      team_structure: asString(normalizedFeatures.team_structure),
      operational_complexity: asString(normalizedFeatures.operational_complexity),
      primary_problem: asString(normalizedFeatures.primary_problem),
      secondary_problem: asString(normalizedFeatures.secondary_problem),
      symptom_tags: asStringArray(normalizedFeatures.symptom_tags),
      inferred_cause_tags: asStringArray(normalizedFeatures.inferred_cause_tags),
      recommendation_ids: asStringArray(normalizedFeatures.recommendation_ids),
      urgency_level: asString(normalizedFeatures.urgency_level),
      clarity_level: asString(normalizedFeatures.clarity_level),
      operating_archetype: asString(normalizedFeatures.operating_archetype),
      benchmark_segment: asString(normalizedFeatures.benchmark_segment),
      benchmark_ready: asBoolean(normalizedFeatures.benchmark_ready),
      classification_confidence: asNumber(normalizedFeatures.classification_confidence),
      normalized_payload: normalizedFeatures
    };

    const upsertFeatures = await supabase
      .from("oc_session_features")
      .upsert(featureRow, { onConflict: "session_id" });

    if (upsertFeatures.error) throw upsertFeatures.error;

    const businessModelTags = asStringArray(normalizedFeatures.business_model_tags);
    const symptomTags = asStringArray(normalizedFeatures.symptom_tags);
    const causeTags = asStringArray(normalizedFeatures.inferred_cause_tags);
    const recommendationIds = asStringArray(normalizedFeatures.recommendation_ids);

    await replaceRows(
      supabase,
      "oc_session_business_models",
      sessionId,
      businessModelTags.map((slug) => ({
        session_id: sessionId,
        business_model_slug: slug,
        is_primary: slug === asString(normalizedFeatures.business_model),
        source: "client_normalized",
        confidence: asNumber(normalizedFeatures.classification_confidence)
      }))
    );

    await replaceRows(
      supabase,
      "oc_session_symptom_tags",
      sessionId,
      symptomTags.map((slug) => ({
        session_id: sessionId,
        symptom_slug: slug,
        source: "client_normalized",
        confidence: asNumber(productLearning.extraction_confidence)
      }))
    );

    await replaceRows(
      supabase,
      "oc_session_cause_tags",
      sessionId,
      causeTags.map((slug) => ({
        session_id: sessionId,
        cause_slug: slug,
        source: "client_normalized",
        confidence: asNumber(productLearning.extraction_confidence)
      }))
    );

    await replaceRows(
      supabase,
      "oc_session_recommendations",
      sessionId,
      recommendationIds.map((id, index) => ({
        session_id: sessionId,
        recommendation_id: id,
        source: "client_normalized",
        rank: index + 1,
        confidence: asNumber(productLearning.extraction_confidence)
      }))
    );

    const eventTypes = new Set<string>();
    const transcript = Array.isArray(rawSession.transcript) ? rawSession.transcript : [];
    const hasMeaningfulUse = transcript.some((item) => asString(asObject(item).role) === "user" && asString(asObject(item).content));

    if (!prior && hasMeaningfulUse) eventTypes.add("session_started");

    const priorSummaryReady = prior?.completion_status === "completed"
      || prior?.completion_status === "contact_submitted";
    const currentSummaryReady = completionStatus === "completed" || completionStatus === "contact_submitted";
    if (currentSummaryReady && !priorSummaryReady) eventTypes.add("session_summary_ready");

    const currentContactSubmitted = asBoolean(rawSession.contact_submitted);
    const priorContactSubmitted = Boolean(prior?.contact_submitted);
    if (currentContactSubmitted && !priorContactSubmitted) eventTypes.add("contact_submitted");

    const currentPackage = asString(contactDetails.package);
    const priorPackage = asString(priorContactDetails.package);
    if (currentPackage && currentPackage !== priorPackage) eventTypes.add("package_selected");

    pendingNotificationEvents.forEach((event) => {
      const eventType = asString(event.event_type);
      if (eventType && allowedEventTypes.has(eventType)) eventTypes.add(eventType);
    });

    const createdEventIds: string[] = [];
    for (const eventType of eventTypes) {
      const priority = inferPriority(eventType);
      const dedupeKey = `${sessionId}:${eventType}`;
      const summaryCard = buildSummaryCard({
        eventType,
        priority,
        capturedAt: new Date().toISOString(),
        rawSession,
        normalizedFeatures,
        contactDetails,
        productLearning
      });

      const insertEvent = await supabase
        .from("oc_notification_events")
        .insert({
          session_id: sessionId,
          event_type: eventType,
          priority,
          status: "pending",
          dedupe_key: dedupeKey,
          summary_card: summaryCard,
          delivery_channels: {}
        })
        .select("id")
        .maybeSingle();

      if (insertEvent.error) {
        const duplicate = String(insertEvent.error.message || "").toLowerCase().includes("duplicate")
          || String(insertEvent.error.code || "") === "23505";
        if (!duplicate) throw insertEvent.error;
        continue;
      }

      if (insertEvent.data?.id) {
        createdEventIds.push(insertEvent.data.id as string);
        await deliverNotification({
          eventId: insertEvent.data.id as string,
          eventType,
          priority,
          summaryCard,
          retryCount: 0,
          maxRetryCount,
          supabase
        });
      }
    }

    await retryPendingNotifications(supabase, sessionId, maxRetryCount);

    return jsonResponse(200, {
      ok: true,
      session_row_id: sessionId,
      client_session_id: clientSessionId,
      notification_events_created: createdEventIds.length
    });
  } catch (error) {
    console.error("session-intelligence-ingest failed", error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Failed to ingest session intelligence."
    });
  }
});
