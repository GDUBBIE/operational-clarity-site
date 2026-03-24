import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

type BusinessTypeSummaryRow = {
  primary_business_type: string | null;
  session_count: number | string | null;
  completed_session_count: number | string | null;
  completion_rate_pct: number | string | null;
  avg_assessment_score: number | string | null;
  avg_context_score: number | string | null;
  avg_confidence_value: number | string | null;
  avg_extraction_confidence: number | string | null;
};

type FrequencyRow = {
  primary_business_type: string | null;
  session_count?: number | string | null;
  symptom_slug?: string | null;
  cause_slug?: string | null;
  recommendation_id?: string | null;
};

type ProductLearningRow = {
  completion_status: string | null;
  last_completed_step: string | null;
  drop_off_step: string | null;
  session_count: number | string | null;
  low_confidence_rate: number | string | null;
  avg_extraction_confidence: number | string | null;
  avg_question_count: number | string | null;
};

type SessionFactRow = {
  session_id: string;
  created_at: string | null;
  completed_at: string | null;
  completion_status: string | null;
  contact_submitted: boolean | null;
  assessment_score: number | string | null;
  context_score: number | string | null;
  confidence_value: number | string | null;
  extraction_confidence: number | string | null;
  primary_business_type: string | null;
  size_band: string | null;
};

type SessionLearningRow = {
  id: string;
  completion_status: string | null;
  last_completed_step: string | null;
  drop_off_step: string | null;
  low_confidence: boolean | null;
  extraction_confidence: number | string | null;
  question_sequence: unknown;
};

type CompletionFilter = "all" | "reached_findings" | "contact_submitted";
type TimeWindowFilter = "7d" | "30d" | "all";

type AnalyticsFilters = {
  businessType: string | null;
  completionStatus: CompletionFilter;
  timeWindow: TimeWindowFilter;
  createdAfter: string | null;
  minSessions: number;
};

type SessionTrendPoint = {
  date: string;
  sessions: number;
};

type CohortRow = {
  business_type: string;
  size_band: string;
  sessions: number;
  reached_findings: number;
  contact_submitted: number;
  conversion_rate_pct: number;
};

type RecommendationEffectivenessRow = {
  recommendation_id: string;
  business_type: string;
  size_band: string;
  sessions_with_recommendation: number;
  contact_submitted: number;
  conversion_rate_pct: number;
};

type ConfidenceSummary = {
  avg_extraction_confidence: number | null;
  low_confidence_session_count: number;
  low_confidence_rate_pct: number;
};

type ConfidenceByBusinessTypeRow = {
  business_type: string;
  sessions: number;
  avg_extraction_confidence: number | null;
  low_confidence_rate_pct: number;
};

type MissingFieldSummary = {
  sessions_missing_business_type: number;
  sessions_missing_recommendations: number;
  sessions_missing_causes: number;
  sessions_missing_symptoms: number;
};

type StageDropoffSummaryRow = {
  stage: string;
  session_count: number;
  pct_of_sessions: number;
  avg_extraction_confidence: number | null;
  low_confidence_rate_pct: number;
};

type StageDropoffByBusinessTypeRow = {
  business_type: string;
  stage: string;
  session_count: number;
  pct_within_business_type: number;
  avg_extraction_confidence: number | null;
  low_confidence_rate_pct: number;
};

type QuestionFrictionSummaryRow = {
  question_key: string;
  question_label: string;
  times_seen: number;
  drop_off_count: number;
  drop_off_rate_pct: number;
  avg_extraction_confidence: number | null;
  missing_symptoms_rate_pct: number;
  missing_causes_rate_pct: number;
  missing_recommendations_rate_pct: number;
};

type QuestionFrictionByBusinessTypeRow = {
  question_key: string;
  question_label: string;
  business_type: string;
  times_seen: number;
  drop_off_count: number;
  drop_off_rate_pct: number;
  avg_extraction_confidence: number | null;
};

const LOW_CONFIDENCE_THRESHOLD = 0.7;
const STAGE_ORDER = ["discover", "diagnose", "findings", "contact_submitted"] as const;

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function roundNumeric(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function startOfUtcDay(input: Date) {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

function addUtcDays(input: Date, days: number) {
  const next = new Date(input.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isoDateKey(input: Date) {
  return startOfUtcDay(input).toISOString().slice(0, 10);
}

function rowDateKey(row: SessionFactRow) {
  const rawValue = row.created_at || row.completed_at;
  if (!rawValue) return null;
  const parsed = new Date(rawValue);
  return Number.isNaN(parsed.getTime()) ? null : isoDateKey(parsed);
}

function parseFilters(url: URL): AnalyticsFilters {
  const rawBusinessType = String(url.searchParams.get("business_type") || "").trim();
  const rawCompletionStatus = String(url.searchParams.get("completion_status") || "all").trim().toLowerCase();
  const rawTimeWindow = String(url.searchParams.get("time_window") || "all").trim().toLowerCase();
  const rawMinSessions = Number(url.searchParams.get("min_sessions") || 3);

  const completionStatus: CompletionFilter = rawCompletionStatus === "reached_findings"
    || rawCompletionStatus === "contact_submitted"
    ? rawCompletionStatus
    : "all";

  const timeWindow: TimeWindowFilter = rawTimeWindow === "7d"
    || rawTimeWindow === "30d"
    ? rawTimeWindow
    : "all";

  let createdAfter: string | null = null;
  if (timeWindow === "7d" || timeWindow === "30d") {
    const days = timeWindow === "7d" ? 7 : 30;
    const threshold = new Date();
    threshold.setUTCDate(threshold.getUTCDate() - days);
    createdAfter = threshold.toISOString();
  }

  return {
    businessType: rawBusinessType && rawBusinessType !== "all" ? rawBusinessType : null,
    completionStatus,
    timeWindow,
    createdAfter,
    minSessions: Number.isFinite(rawMinSessions) && rawMinSessions >= 1
      ? Math.floor(rawMinSessions)
      : 3
  };
}

function aggregateFrequency<T extends Record<string, unknown>>(
  rows: T[],
  key: "symptom_slug" | "cause_slug" | "recommendation_id"
) {
  const totals = new Map<string, number>();

  rows.forEach((row) => {
    const slug = String(row[key] || "").trim();
    if (!slug) return;
    const increment = row.session_count != null ? toNumber(row.session_count as number | string | null) : 1;
    totals.set(slug, (totals.get(slug) || 0) + increment);
  });

  return Array.from(totals.entries())
    .map(([slug, session_count]) => ({
      [key]: slug,
      session_count
    }))
    .sort((a, b) => b.session_count - a.session_count)
    .slice(0, 15);
}

function buildConversionMetrics(rows: SessionLearningRow[]) {
  return rows.reduce((acc, row) => {
    const completionStatus = String(row.completion_status || "");
    const lastCompletedStep = String(row.last_completed_step || "");
    const increment = 1;

    acc.sessions += increment;
    if (
      completionStatus === "completed"
      || completionStatus === "contact_submitted"
      || lastCompletedStep === "findings"
    ) {
      acc.reached_findings += increment;
    }

    if (completionStatus === "contact_submitted") {
      acc.contact_submitted += increment;
    }

    return acc;
  }, {
    sessions: 0,
    reached_findings: 0,
    contact_submitted: 0
  });
}

function averageFrom(total: number, count: number) {
  return count > 0 ? roundNumeric(total / count) : null;
}

function aggregateBusinessTypeDistribution(rows: SessionFactRow[]) {
  const buckets = new Map<string, {
    primary_business_type: string;
    session_count: number;
    completed_session_count: number;
    assessment_total: number;
    assessment_count: number;
    context_total: number;
    context_count: number;
    confidence_total: number;
    confidence_count: number;
    extraction_total: number;
    extraction_count: number;
  }>();

  rows.forEach((row) => {
    const businessType = String(row.primary_business_type || "other").trim() || "other";
    const bucket = buckets.get(businessType) || {
      primary_business_type: businessType,
      session_count: 0,
      completed_session_count: 0,
      assessment_total: 0,
      assessment_count: 0,
      context_total: 0,
      context_count: 0,
      confidence_total: 0,
      confidence_count: 0,
      extraction_total: 0,
      extraction_count: 0
    };

    bucket.session_count += 1;

    if (row.completion_status === "completed" || row.completion_status === "contact_submitted") {
      bucket.completed_session_count += 1;
    }

    const assessmentScore = toNumber(row.assessment_score);
    if (row.assessment_score != null) {
      bucket.assessment_total += assessmentScore;
      bucket.assessment_count += 1;
    }

    const contextScore = toNumber(row.context_score);
    if (row.context_score != null) {
      bucket.context_total += contextScore;
      bucket.context_count += 1;
    }

    const confidenceValue = toNumber(row.confidence_value);
    if (row.confidence_value != null) {
      bucket.confidence_total += confidenceValue;
      bucket.confidence_count += 1;
    }

    const extractionConfidence = toNumber(row.extraction_confidence);
    if (row.extraction_confidence != null) {
      bucket.extraction_total += extractionConfidence;
      bucket.extraction_count += 1;
    }

    buckets.set(businessType, bucket);
  });

  return Array.from(buckets.values())
    .map((bucket) => ({
      primary_business_type: bucket.primary_business_type,
      session_count: bucket.session_count,
      completed_session_count: bucket.completed_session_count,
      completion_rate_pct: bucket.session_count > 0
        ? roundNumeric((bucket.completed_session_count / bucket.session_count) * 100)
        : 0,
      avg_assessment_score: averageFrom(bucket.assessment_total, bucket.assessment_count),
      avg_context_score: averageFrom(bucket.context_total, bucket.context_count),
      avg_confidence_value: averageFrom(bucket.confidence_total, bucket.confidence_count),
      avg_extraction_confidence: averageFrom(bucket.extraction_total, bucket.extraction_count)
    }))
    .sort((a, b) => b.session_count - a.session_count);
}

function aggregateProductLearning(rows: SessionLearningRow[]): ProductLearningRow[] {
  const buckets = new Map<string, {
    completion_status: string | null;
    last_completed_step: string | null;
    drop_off_step: string | null;
    session_count: number;
    low_confidence_total: number;
    extraction_total: number;
    extraction_count: number;
    question_total: number;
  }>();

  rows.forEach((row) => {
    const key = [
      row.completion_status || "",
      row.last_completed_step || "",
      row.drop_off_step || ""
    ].join("::");

    const bucket = buckets.get(key) || {
      completion_status: row.completion_status || null,
      last_completed_step: row.last_completed_step || null,
      drop_off_step: row.drop_off_step || null,
      session_count: 0,
      low_confidence_total: 0,
      extraction_total: 0,
      extraction_count: 0,
      question_total: 0
    };

    bucket.session_count += 1;
    bucket.low_confidence_total += row.low_confidence ? 1 : 0;

    if (row.extraction_confidence != null) {
      bucket.extraction_total += toNumber(row.extraction_confidence);
      bucket.extraction_count += 1;
    }

    bucket.question_total += Array.isArray(row.question_sequence) ? row.question_sequence.length : 0;
    buckets.set(key, bucket);
  });

  return Array.from(buckets.values())
    .map((bucket) => ({
      completion_status: bucket.completion_status,
      last_completed_step: bucket.last_completed_step,
      drop_off_step: bucket.drop_off_step,
      session_count: bucket.session_count,
      low_confidence_rate: bucket.session_count > 0
        ? roundNumeric(bucket.low_confidence_total / bucket.session_count)
        : 0,
      avg_extraction_confidence: averageFrom(bucket.extraction_total, bucket.extraction_count),
      avg_question_count: bucket.session_count > 0
        ? roundNumeric(bucket.question_total / bucket.session_count)
        : 0
    }))
    .sort((a, b) => toNumber(b.session_count) - toNumber(a.session_count));
}

function sessionIdSetFromRows(rows: FrequencyRow[]) {
  return new Set(
    rows
      .map((row) => String((row as Record<string, unknown>).session_id || "").trim())
      .filter(Boolean)
  );
}

function parseJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function cleanQuestionText(value: unknown) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?]+$/, "")
    .trim();
}

function slugifyQuestion(value: string) {
  const slug = cleanQuestionText(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 96);

  return slug || "unknown_question";
}

function extractQuestionInstances(value: unknown) {
  return parseJsonArray(value)
    .map((entry) => {
      const record = entry && typeof entry === "object"
        ? entry as Record<string, unknown>
        : null;
      const rawLabel = record
        ? (record.question ?? record.label ?? record.text ?? record.prompt ?? "")
        : entry;
      const rawKey = record
        ? (record.question_key ?? record.key ?? "")
        : "";
      const questionLabel = cleanQuestionText(rawLabel);
      const questionKey = cleanQuestionText(rawKey) || questionLabel;

      if (!questionKey) return null;

      return {
        question_key: slugifyQuestion(questionKey),
        question_label: questionLabel || cleanQuestionText(rawKey) || "Unknown question"
      };
    })
    .filter((entry): entry is { question_key: string; question_label: string } => Boolean(entry));
}

function isDroppedBeforeFindings(row: SessionLearningRow) {
  const stage = normalizeStage(row);
  return stage === "discover" || stage === "diagnose";
}

function buildSessionTrend(rows: SessionFactRow[], timeWindow: TimeWindowFilter): SessionTrendPoint[] {
  const countsByDate = new Map<string, number>();

  rows.forEach((row) => {
    const key = rowDateKey(row);
    if (!key) return;
    countsByDate.set(key, (countsByDate.get(key) || 0) + 1);
  });

  const today = startOfUtcDay(new Date());
  let startDate = today;
  let endDate = today;

  if (timeWindow === "7d" || timeWindow === "30d") {
    const days = timeWindow === "7d" ? 7 : 30;
    startDate = addUtcDays(today, -(days - 1));
  } else {
    const sortedKeys = Array.from(countsByDate.keys()).sort();
    if (sortedKeys.length > 0) {
      startDate = new Date(`${sortedKeys[0]}T00:00:00.000Z`);
      endDate = new Date(`${sortedKeys[sortedKeys.length - 1]}T00:00:00.000Z`);
    }
  }

  const trend: SessionTrendPoint[] = [];
  for (let cursor = startDate; cursor.getTime() <= endDate.getTime(); cursor = addUtcDays(cursor, 1)) {
    const key = isoDateKey(cursor);
    trend.push({
      date: key,
      sessions: countsByDate.get(key) || 0
    });
  }

  return trend;
}

function buildCohorts(rows: SessionFactRow[], minSessions: number): CohortRow[] {
  const buckets = new Map<string, CohortRow>();

  rows.forEach((row) => {
    const businessType = String(row.primary_business_type || "other").trim() || "other";
    const sizeBand = String(row.size_band || "unknown").trim() || "unknown";
    const key = `${businessType}::${sizeBand}`;
    const bucket = buckets.get(key) || {
      business_type: businessType,
      size_band: sizeBand,
      sessions: 0,
      reached_findings: 0,
      contact_submitted: 0,
      conversion_rate_pct: 0
    };

    bucket.sessions += 1;

    if (row.completion_status === "completed" || row.completion_status === "contact_submitted") {
      bucket.reached_findings += 1;
    }

    if (row.completion_status === "contact_submitted") {
      bucket.contact_submitted += 1;
    }

    buckets.set(key, bucket);
  });

  return Array.from(buckets.values())
    .map((bucket) => ({
      ...bucket,
      conversion_rate_pct: bucket.sessions > 0
        ? roundNumeric((bucket.contact_submitted / bucket.sessions) * 100)
        : 0
    }))
    .filter((bucket) => bucket.sessions >= minSessions)
    .sort((a, b) => {
      if (b.sessions !== a.sessions) return b.sessions - a.sessions;
      if (a.business_type !== b.business_type) return a.business_type.localeCompare(b.business_type);
      return a.size_band.localeCompare(b.size_band);
    });
}

function buildRecommendationEffectiveness(
  rows: SessionFactRow[],
  recommendationRows: FrequencyRow[],
  minSessions: number
): RecommendationEffectivenessRow[] {
  const factsBySessionId = new Map<string, SessionFactRow>();
  rows.forEach((row) => {
    if (row.session_id) factsBySessionId.set(row.session_id, row);
  });

  const seenSessionRecommendations = new Set<string>();
  const buckets = new Map<string, RecommendationEffectivenessRow>();

  recommendationRows.forEach((row) => {
    const sessionId = String((row as Record<string, unknown>).session_id || "").trim();
    const recommendationId = String(row.recommendation_id || "").trim();
    if (!sessionId || !recommendationId) return;

    const dedupeKey = `${sessionId}::${recommendationId}`;
    if (seenSessionRecommendations.has(dedupeKey)) return;
    seenSessionRecommendations.add(dedupeKey);

    const fact = factsBySessionId.get(sessionId);
    if (!fact) return;

    const businessType = String(fact.primary_business_type || "other").trim() || "other";
    const sizeBand = String(fact.size_band || "unknown").trim() || "unknown";
    const bucketKey = `${recommendationId}::${businessType}::${sizeBand}`;
    const bucket = buckets.get(bucketKey) || {
      recommendation_id: recommendationId,
      business_type: businessType,
      size_band: sizeBand,
      sessions_with_recommendation: 0,
      contact_submitted: 0,
      conversion_rate_pct: 0
    };

    bucket.sessions_with_recommendation += 1;

    if (fact.completion_status === "contact_submitted") {
      bucket.contact_submitted += 1;
    }

    buckets.set(bucketKey, bucket);
  });

  return Array.from(buckets.values())
    .map((bucket) => ({
      ...bucket,
      conversion_rate_pct: bucket.sessions_with_recommendation > 0
        ? roundNumeric((bucket.contact_submitted / bucket.sessions_with_recommendation) * 100)
        : 0
    }))
    .filter((bucket) => bucket.sessions_with_recommendation >= minSessions)
    .sort((a, b) => {
      if (b.sessions_with_recommendation !== a.sessions_with_recommendation) {
        return b.sessions_with_recommendation - a.sessions_with_recommendation;
      }
      if (b.conversion_rate_pct !== a.conversion_rate_pct) {
        return b.conversion_rate_pct - a.conversion_rate_pct;
      }
      if (a.recommendation_id !== b.recommendation_id) {
        return a.recommendation_id.localeCompare(b.recommendation_id);
      }
      if (a.business_type !== b.business_type) {
        return a.business_type.localeCompare(b.business_type);
      }
      return a.size_band.localeCompare(b.size_band);
    });
}

function buildConfidenceSummary(rows: SessionFactRow[]): ConfidenceSummary {
  let extractionTotal = 0;
  let extractionCount = 0;
  let lowConfidenceSessionCount = 0;

  rows.forEach((row) => {
    const extractionConfidence = row.extraction_confidence;
    if (extractionConfidence == null) return;
    const value = toNumber(extractionConfidence);
    extractionTotal += value;
    extractionCount += 1;
    if (value < LOW_CONFIDENCE_THRESHOLD) {
      lowConfidenceSessionCount += 1;
    }
  });

  return {
    avg_extraction_confidence: averageFrom(extractionTotal, extractionCount),
    low_confidence_session_count: lowConfidenceSessionCount,
    low_confidence_rate_pct: rows.length > 0
      ? roundNumeric((lowConfidenceSessionCount / rows.length) * 100)
      : 0
  };
}

function buildConfidenceByBusinessType(
  rows: SessionFactRow[],
  minSessions: number
): ConfidenceByBusinessTypeRow[] {
  const buckets = new Map<string, {
    business_type: string;
    sessions: number;
    extraction_total: number;
    extraction_count: number;
    low_confidence_count: number;
  }>();

  rows.forEach((row) => {
    const businessType = String(row.primary_business_type || "other").trim() || "other";
    const bucket = buckets.get(businessType) || {
      business_type: businessType,
      sessions: 0,
      extraction_total: 0,
      extraction_count: 0,
      low_confidence_count: 0
    };

    bucket.sessions += 1;

    if (row.extraction_confidence != null) {
      const value = toNumber(row.extraction_confidence);
      bucket.extraction_total += value;
      bucket.extraction_count += 1;
      if (value < LOW_CONFIDENCE_THRESHOLD) {
        bucket.low_confidence_count += 1;
      }
    }

    buckets.set(businessType, bucket);
  });

  return Array.from(buckets.values())
    .map((bucket) => ({
      business_type: bucket.business_type,
      sessions: bucket.sessions,
      avg_extraction_confidence: averageFrom(bucket.extraction_total, bucket.extraction_count),
      low_confidence_rate_pct: bucket.sessions > 0
        ? roundNumeric((bucket.low_confidence_count / bucket.sessions) * 100)
        : 0
    }))
    .filter((bucket) => bucket.sessions >= minSessions)
    .sort((a, b) => {
      if (b.sessions !== a.sessions) return b.sessions - a.sessions;
      return a.business_type.localeCompare(b.business_type);
    });
}

function buildMissingFieldSummary(
  rows: SessionFactRow[],
  symptomRows: FrequencyRow[],
  causeRows: FrequencyRow[],
  recommendationRows: FrequencyRow[]
): MissingFieldSummary {
  const sessionIdsWithSymptoms = sessionIdSetFromRows(symptomRows);
  const sessionIdsWithCauses = sessionIdSetFromRows(causeRows);
  const sessionIdsWithRecommendations = sessionIdSetFromRows(recommendationRows);

  return rows.reduce((acc, row) => {
    const sessionId = String(row.session_id || "").trim();
    const businessType = String(row.primary_business_type || "").trim();

    if (!businessType) acc.sessions_missing_business_type += 1;
    if (!sessionIdsWithRecommendations.has(sessionId)) acc.sessions_missing_recommendations += 1;
    if (!sessionIdsWithCauses.has(sessionId)) acc.sessions_missing_causes += 1;
    if (!sessionIdsWithSymptoms.has(sessionId)) acc.sessions_missing_symptoms += 1;

    return acc;
  }, {
    sessions_missing_business_type: 0,
    sessions_missing_recommendations: 0,
    sessions_missing_causes: 0,
    sessions_missing_symptoms: 0
  });
}

function buildQuestionFrictionSummary(
  rows: SessionLearningRow[],
  facts: SessionFactRow[],
  symptomRows: FrequencyRow[],
  causeRows: FrequencyRow[],
  recommendationRows: FrequencyRow[],
  minSessions: number
): QuestionFrictionSummaryRow[] {
  const factSessionIds = new Set(
    facts
      .map((row) => String(row.session_id || "").trim())
      .filter(Boolean)
  );
  const sessionIdsWithSymptoms = sessionIdSetFromRows(symptomRows);
  const sessionIdsWithCauses = sessionIdSetFromRows(causeRows);
  const sessionIdsWithRecommendations = sessionIdSetFromRows(recommendationRows);
  const buckets = new Map<string, {
    question_key: string;
    question_label: string;
    times_seen: number;
    drop_off_count: number;
    extraction_total: number;
    extraction_count: number;
    missing_symptoms_count: number;
    missing_causes_count: number;
    missing_recommendations_count: number;
  }>();

  rows.forEach((row) => {
    const sessionId = String(row.id || "").trim();
    if (!sessionId || !factSessionIds.has(sessionId)) return;

    const questionInstances = extractQuestionInstances(row.question_sequence);
    if (questionInstances.length === 0) return;

    const seenQuestionKeys = new Set<string>();
    questionInstances.forEach((instance) => {
      if (seenQuestionKeys.has(instance.question_key)) return;
      seenQuestionKeys.add(instance.question_key);

      const bucket = buckets.get(instance.question_key) || {
        question_key: instance.question_key,
        question_label: instance.question_label,
        times_seen: 0,
        drop_off_count: 0,
        extraction_total: 0,
        extraction_count: 0,
        missing_symptoms_count: 0,
        missing_causes_count: 0,
        missing_recommendations_count: 0
      };

      bucket.times_seen += 1;
      if (row.extraction_confidence != null) {
        bucket.extraction_total += toNumber(row.extraction_confidence);
        bucket.extraction_count += 1;
      }
      if (!sessionIdsWithSymptoms.has(sessionId)) bucket.missing_symptoms_count += 1;
      if (!sessionIdsWithCauses.has(sessionId)) bucket.missing_causes_count += 1;
      if (!sessionIdsWithRecommendations.has(sessionId)) bucket.missing_recommendations_count += 1;
      buckets.set(instance.question_key, bucket);
    });

    const lastQuestion = questionInstances[questionInstances.length - 1];
    if (lastQuestion && isDroppedBeforeFindings(row)) {
      const bucket = buckets.get(lastQuestion.question_key);
      if (bucket) {
        bucket.drop_off_count += 1;
      }
    }
  });

  return Array.from(buckets.values())
    .map((bucket) => ({
      question_key: bucket.question_key,
      question_label: bucket.question_label,
      times_seen: bucket.times_seen,
      drop_off_count: bucket.drop_off_count,
      drop_off_rate_pct: bucket.times_seen > 0
        ? roundNumeric((bucket.drop_off_count / bucket.times_seen) * 100)
        : 0,
      avg_extraction_confidence: averageFrom(bucket.extraction_total, bucket.extraction_count),
      missing_symptoms_rate_pct: bucket.times_seen > 0
        ? roundNumeric((bucket.missing_symptoms_count / bucket.times_seen) * 100)
        : 0,
      missing_causes_rate_pct: bucket.times_seen > 0
        ? roundNumeric((bucket.missing_causes_count / bucket.times_seen) * 100)
        : 0,
      missing_recommendations_rate_pct: bucket.times_seen > 0
        ? roundNumeric((bucket.missing_recommendations_count / bucket.times_seen) * 100)
        : 0
    }))
    .filter((bucket) => bucket.times_seen >= minSessions)
    .sort((a, b) => {
      if (b.drop_off_rate_pct !== a.drop_off_rate_pct) return b.drop_off_rate_pct - a.drop_off_rate_pct;
      if (b.times_seen !== a.times_seen) return b.times_seen - a.times_seen;
      return a.question_key.localeCompare(b.question_key);
    });
}

function buildQuestionFrictionByBusinessType(
  rows: SessionLearningRow[],
  facts: SessionFactRow[],
  minSessions: number
): QuestionFrictionByBusinessTypeRow[] {
  const factsBySessionId = new Map<string, SessionFactRow>();
  facts.forEach((row) => {
    if (row.session_id) factsBySessionId.set(row.session_id, row);
  });

  const buckets = new Map<string, {
    question_key: string;
    question_label: string;
    business_type: string;
    times_seen: number;
    drop_off_count: number;
    extraction_total: number;
    extraction_count: number;
  }>();

  rows.forEach((row) => {
    const sessionId = String(row.id || "").trim();
    const fact = factsBySessionId.get(sessionId);
    if (!fact) return;

    const businessType = String(fact.primary_business_type || "other").trim() || "other";
    const questionInstances = extractQuestionInstances(row.question_sequence);
    if (questionInstances.length === 0) return;

    const seenBucketKeys = new Set<string>();
    questionInstances.forEach((instance) => {
      const bucketKey = `${instance.question_key}::${businessType}`;
      if (seenBucketKeys.has(bucketKey)) return;
      seenBucketKeys.add(bucketKey);

      const bucket = buckets.get(bucketKey) || {
        question_key: instance.question_key,
        question_label: instance.question_label,
        business_type: businessType,
        times_seen: 0,
        drop_off_count: 0,
        extraction_total: 0,
        extraction_count: 0
      };

      bucket.times_seen += 1;
      if (row.extraction_confidence != null) {
        bucket.extraction_total += toNumber(row.extraction_confidence);
        bucket.extraction_count += 1;
      }

      buckets.set(bucketKey, bucket);
    });

    const lastQuestion = questionInstances[questionInstances.length - 1];
    if (lastQuestion && isDroppedBeforeFindings(row)) {
      const bucketKey = `${lastQuestion.question_key}::${businessType}`;
      const bucket = buckets.get(bucketKey);
      if (bucket) {
        bucket.drop_off_count += 1;
      }
    }
  });

  return Array.from(buckets.values())
    .map((bucket) => ({
      question_key: bucket.question_key,
      question_label: bucket.question_label,
      business_type: bucket.business_type,
      times_seen: bucket.times_seen,
      drop_off_count: bucket.drop_off_count,
      drop_off_rate_pct: bucket.times_seen > 0
        ? roundNumeric((bucket.drop_off_count / bucket.times_seen) * 100)
        : 0,
      avg_extraction_confidence: averageFrom(bucket.extraction_total, bucket.extraction_count)
    }))
    .filter((bucket) => bucket.times_seen >= minSessions)
    .sort((a, b) => {
      if (b.drop_off_rate_pct !== a.drop_off_rate_pct) return b.drop_off_rate_pct - a.drop_off_rate_pct;
      if (b.times_seen !== a.times_seen) return b.times_seen - a.times_seen;
      if (a.business_type !== b.business_type) return a.business_type.localeCompare(b.business_type);
      return a.question_key.localeCompare(b.question_key);
    });
}

function normalizeStage(row: SessionLearningRow): string {
  if (row.completion_status === "contact_submitted") return "contact_submitted";

  const rawStage = String(
    (row.completion_status === "in_progress" ? row.drop_off_step : row.last_completed_step)
    || row.drop_off_step
    || row.last_completed_step
    || ""
  ).trim().toLowerCase();

  if (rawStage.includes("contact")) return "contact_submitted";
  if (rawStage.includes("find")) return "findings";
  if (rawStage.includes("diag") || rawStage.includes("analy")) return "diagnose";
  return "discover";
}

function buildStageDropoffSummary(rows: SessionLearningRow[]): StageDropoffSummaryRow[] {
  const buckets = new Map<string, {
    stage: string;
    session_count: number;
    extraction_total: number;
    extraction_count: number;
    low_confidence_count: number;
  }>();

  STAGE_ORDER.forEach((stage) => {
    buckets.set(stage, {
      stage,
      session_count: 0,
      extraction_total: 0,
      extraction_count: 0,
      low_confidence_count: 0
    });
  });

  rows.forEach((row) => {
    const stage = normalizeStage(row);
    const bucket = buckets.get(stage) || {
      stage,
      session_count: 0,
      extraction_total: 0,
      extraction_count: 0,
      low_confidence_count: 0
    };

    bucket.session_count += 1;
    if (row.extraction_confidence != null) {
      const confidence = toNumber(row.extraction_confidence);
      bucket.extraction_total += confidence;
      bucket.extraction_count += 1;
      if (confidence < LOW_CONFIDENCE_THRESHOLD) {
        bucket.low_confidence_count += 1;
      }
    }

    buckets.set(stage, bucket);
  });

  return STAGE_ORDER.map((stage) => {
    const bucket = buckets.get(stage)!;
    return {
      stage,
      session_count: bucket.session_count,
      pct_of_sessions: rows.length > 0
        ? roundNumeric((bucket.session_count / rows.length) * 100)
        : 0,
      avg_extraction_confidence: averageFrom(bucket.extraction_total, bucket.extraction_count),
      low_confidence_rate_pct: bucket.session_count > 0
        ? roundNumeric((bucket.low_confidence_count / bucket.session_count) * 100)
        : 0
    };
  });
}

function buildStageDropoffByBusinessType(
  rows: SessionLearningRow[],
  facts: SessionFactRow[],
  minSessions: number
): StageDropoffByBusinessTypeRow[] {
  const factsBySessionId = new Map<string, SessionFactRow>();
  facts.forEach((row) => {
    if (row.session_id) factsBySessionId.set(row.session_id, row);
  });

  const businessTypeTotals = new Map<string, number>();
  const buckets = new Map<string, {
    business_type: string;
    stage: string;
    session_count: number;
    extraction_total: number;
    extraction_count: number;
    low_confidence_count: number;
  }>();

  rows.forEach((row) => {
    const sessionId = String(row.id || "").trim();
    const fact = factsBySessionId.get(sessionId);
    const businessType = String(fact?.primary_business_type || "other").trim() || "other";
    const stage = normalizeStage(row);
    const key = `${businessType}::${stage}`;

    businessTypeTotals.set(businessType, (businessTypeTotals.get(businessType) || 0) + 1);

    const bucket = buckets.get(key) || {
      business_type: businessType,
      stage,
      session_count: 0,
      extraction_total: 0,
      extraction_count: 0,
      low_confidence_count: 0
    };

    bucket.session_count += 1;
    if (row.extraction_confidence != null) {
      const confidence = toNumber(row.extraction_confidence);
      bucket.extraction_total += confidence;
      bucket.extraction_count += 1;
      if (confidence < LOW_CONFIDENCE_THRESHOLD) {
        bucket.low_confidence_count += 1;
      }
    }

    buckets.set(key, bucket);
  });

  return Array.from(buckets.values())
    .map((bucket) => ({
      business_type: bucket.business_type,
      stage: bucket.stage,
      session_count: bucket.session_count,
      pct_within_business_type: (businessTypeTotals.get(bucket.business_type) || 0) > 0
        ? roundNumeric((bucket.session_count / (businessTypeTotals.get(bucket.business_type) || 1)) * 100)
        : 0,
      avg_extraction_confidence: averageFrom(bucket.extraction_total, bucket.extraction_count),
      low_confidence_rate_pct: bucket.session_count > 0
        ? roundNumeric((bucket.low_confidence_count / bucket.session_count) * 100)
        : 0
    }))
    .filter((bucket) => bucket.session_count >= minSessions)
    .sort((a, b) => {
      const businessTypeCompare = a.business_type.localeCompare(b.business_type);
      if (businessTypeCompare !== 0) return businessTypeCompare;
      const stageCompare = STAGE_ORDER.indexOf(a.stage as (typeof STAGE_ORDER)[number])
        - STAGE_ORDER.indexOf(b.stage as (typeof STAGE_ORDER)[number]);
      if (stageCompare !== 0) return stageCompare;
      return b.session_count - a.session_count;
    });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: "Supabase environment variables are missing." });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  try {
    const requestUrl = new URL(request.url);
    const filters = parseFilters(requestUrl);

    const [
      businessTypeSummaryResult,
      factsResult
    ] = await Promise.all([
      supabase
        .from("oc_benchmark_business_type_summary")
        .select("primary_business_type, session_count")
        .order("session_count", { ascending: false }),
      (() => {
        let query = supabase
          .from("oc_benchmark_session_facts")
          .select("*")
          .order("created_at", { ascending: false });

        if (filters.businessType) {
          query = query.eq("primary_business_type", filters.businessType);
        }

        if (filters.completionStatus === "reached_findings") {
          query = query.in("completion_status", ["completed", "contact_submitted"]);
        } else if (filters.completionStatus === "contact_submitted") {
          query = query.eq("completion_status", "contact_submitted");
        }

        if (filters.createdAfter) {
          query = query.gte("created_at", filters.createdAfter);
        }

        return query;
      })()
    ]);

    const errors = [
      businessTypeSummaryResult.error,
      factsResult.error
    ].filter(Boolean);

    if (errors.length > 0) {
      throw new Error(errors.map((error) => error?.message || "Unknown query error").join(" | "));
    }

    const businessTypeOptions = ((businessTypeSummaryResult.data || []) as BusinessTypeSummaryRow[])
      .map((row) => String(row.primary_business_type || "").trim())
      .filter(Boolean);
    const facts = (factsResult.data || []) as SessionFactRow[];
    const sessionIds = facts.map((row) => row.session_id).filter(Boolean);

    let symptomRows: FrequencyRow[] = [];
    let causeRows: FrequencyRow[] = [];
    let recommendationRows: FrequencyRow[] = [];
    let sessionLearningRows: SessionLearningRow[] = [];

    if (sessionIds.length > 0) {
      const [
        symptomResult,
        causeResult,
        recommendationResult,
        sessionLearningResult
      ] = await Promise.all([
        supabase
          .from("oc_session_symptom_tags")
          .select("session_id, symptom_slug")
          .in("session_id", sessionIds),
        supabase
          .from("oc_session_cause_tags")
          .select("session_id, cause_slug")
          .in("session_id", sessionIds),
        supabase
          .from("oc_session_recommendations")
          .select("session_id, recommendation_id")
          .in("session_id", sessionIds),
        supabase
          .from("oc_sessions")
          .select("id, completion_status, last_completed_step, drop_off_step, low_confidence, extraction_confidence, question_sequence")
          .in("id", sessionIds)
      ]);

      const secondaryErrors = [
        symptomResult.error,
        causeResult.error,
        recommendationResult.error,
        sessionLearningResult.error
      ].filter(Boolean);

      if (secondaryErrors.length > 0) {
        throw new Error(secondaryErrors.map((error) => error?.message || "Unknown query error").join(" | "));
      }

      symptomRows = (symptomResult.data || []) as FrequencyRow[];
      causeRows = (causeResult.data || []) as FrequencyRow[];
      recommendationRows = (recommendationResult.data || []) as FrequencyRow[];
      sessionLearningRows = (sessionLearningResult.data || []) as SessionLearningRow[];
    }

    const businessTypeDistribution = aggregateBusinessTypeDistribution(facts);
    const productLearning = aggregateProductLearning(sessionLearningRows);
    const sessionTrend = buildSessionTrend(facts, filters.timeWindow);
    const cohorts = buildCohorts(facts, filters.minSessions);
    const recommendationEffectiveness = buildRecommendationEffectiveness(facts, recommendationRows, filters.minSessions);
    const confidenceSummary = buildConfidenceSummary(facts);
    const confidenceByBusinessType = buildConfidenceByBusinessType(facts, filters.minSessions);
    const missingFieldSummary = buildMissingFieldSummary(facts, symptomRows, causeRows, recommendationRows);
    const stageDropoffSummary = buildStageDropoffSummary(sessionLearningRows);
    const stageDropoffByBusinessType = buildStageDropoffByBusinessType(sessionLearningRows, facts, filters.minSessions);
    const questionFrictionSummary = buildQuestionFrictionSummary(
      sessionLearningRows,
      facts,
      symptomRows,
      causeRows,
      recommendationRows,
      filters.minSessions
    );
    const questionFrictionByBusinessType = buildQuestionFrictionByBusinessType(
      sessionLearningRows,
      facts,
      filters.minSessions
    );

    return jsonResponse(200, {
      generated_at: new Date().toISOString(),
      filters: {
        business_type: filters.businessType || "all",
        completion_status: filters.completionStatus,
        time_window: filters.timeWindow,
        created_after: filters.createdAfter,
        min_sessions: filters.minSessions
      },
      filter_options: {
        business_types: businessTypeOptions
      },
      conversion_metrics: buildConversionMetrics(sessionLearningRows),
      business_type_distribution: businessTypeDistribution,
      session_trend: sessionTrend,
      cohorts,
      recommendation_effectiveness: recommendationEffectiveness,
      confidence_summary: confidenceSummary,
      confidence_by_business_type: confidenceByBusinessType,
      missing_field_summary: missingFieldSummary,
      stage_dropoff_summary: stageDropoffSummary,
      stage_dropoff_by_business_type: stageDropoffByBusinessType,
      question_friction_summary: questionFrictionSummary,
      question_friction_by_business_type: questionFrictionByBusinessType,
      top_symptoms: aggregateFrequency(symptomRows, "symptom_slug"),
      top_causes: aggregateFrequency(causeRows, "cause_slug"),
      top_recommendations: aggregateFrequency(recommendationRows, "recommendation_id"),
      product_learning: productLearning
    });
  } catch (error) {
    console.error("internal-analytics-snapshot failed", error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Unable to load analytics snapshot."
    });
  }
});
