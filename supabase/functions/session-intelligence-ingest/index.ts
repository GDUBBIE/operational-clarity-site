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
  } catch (error) {
    return jsonResponse(400, { error: "Request body must be valid JSON." });
  }

  const rawSession = asObject(payload.raw_session || payload.session || payload);
  const normalizedFeatures = asObject(payload.normalized_features);
  const productLearning = asObject(payload.product_learning);

  const clientSessionId = asString(rawSession.session_id);
  if (!clientSessionId) {
    return jsonResponse(400, { error: "raw_session.session_id is required." });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  try {
    const completionStatus = normalizeCompletionStatus(rawSession.completion_status);
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
      notes: {
        schema_version: payload.schema_version ?? null,
        captured_at: payload.captured_at ?? null
      }
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

    return jsonResponse(200, {
      ok: true,
      session_row_id: sessionId,
      client_session_id: clientSessionId
    });
  } catch (error) {
    console.error("session-intelligence-ingest failed", error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Failed to ingest session intelligence."
    });
  }
});
