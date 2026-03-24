const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const REQUEST_TIMEOUT_MS = 90000;

const STAGE_VALUES = ["discover", "analyze", "findings"] as const;
const BUSINESS_TYPE_SLUGS = [
  "steel_fabrication",
  "custom_fabrication",
  "trucking_logistics",
  "freight_hauling",
  "last_mile_delivery",
  "commercial_cleaning",
  "janitorial_recurring",
  "landscaping",
  "grounds_maintenance",
  "hvac",
  "commercial_hvac",
  "residential_hvac",
  "general_contractor",
  "trade_contractor",
  "specialty_subcontractor",
  "agency_consulting",
  "marketing_agency",
  "ops_consulting",
  "manufacturing",
  "job_shop_manufacturing",
  "distribution",
  "wholesale_distribution",
  "retail_local_service",
  "auto_service",
  "professional_service",
  "medical_practice",
  "other"
] as const;
const BUSINESS_MODEL_SLUGS = [
  "project_based",
  "recurring_revenue",
  "quote_heavy",
  "route_heavy",
  "inventory_heavy",
  "labor_heavy",
  "owner_led",
  "field_service",
  "office_and_field",
  "transactional",
  "production_based"
] as const;
const SYMPTOM_TAG_SLUGS = [
  "low_win_rate",
  "busy_but_unprofitable",
  "owner_bottleneck",
  "scheduling_chaos",
  "cash_flow_pressure",
  "backlog_instability",
  "low_visibility",
  "rework",
  "slow_collections",
  "team_dependency",
  "underpriced_work",
  "inconsistent_follow_through",
  "weak_handoff",
  "capacity_constraint",
  "demand_uncertainty",
  "scope_creep",
  "margin_leak",
  "dispatch_noise",
  "no_kpi_discipline",
  "sales_pipeline_gap"
] as const;
const CAUSE_TAG_SLUGS = [
  "poor_bid_selection",
  "weak_scope_alignment",
  "pricing_visibility_gap",
  "owner_centralized_decisions",
  "no_capacity_planning",
  "weak_dispatch_system",
  "poor_job_costing",
  "inconsistent_process_adherence",
  "unclear_roles",
  "missing_forecasting",
  "fragmented_tooling",
  "weak_metric_discipline",
  "reactive_firefighting",
  "labor_mismatch",
  "weak_sales_qualification",
  "no_standard_operating_rhythm",
  "weak_cash_collection_process"
] as const;
const RECOMMENDATION_KEYS = [
  "create_gc_pick_rule",
  "standardize_scope_sheet",
  "track_hit_rate_by_scope",
  "implement_job_costing_review",
  "build_owner_handoff_lane",
  "set_weekly_capacity_planning",
  "launch_dispatch_board",
  "create_margin_guardrails",
  "define_role_scoreboards",
  "standardize_closeout_checklist",
  "set_collections_cadence",
  "install_daily_flash_kpis",
  "segment_customers_by_fit"
] as const;
const OPERATING_ARCHETYPE_SLUGS = [
  "busy_but_blind",
  "growing_but_owner_locked",
  "selling_but_underpricing",
  "chaotic_execution",
  "kpi_weak_but_stable",
  "demand_rich_capacity_constrained",
  "profitable_core_weak_growth_engine"
] as const;
const BENCHMARK_SIZE_BANDS = [
  "solo_or_owner_led",
  "small_team_2_5",
  "growing_team_6_15",
  "scaled_team_16_50",
  "larger_team_51_plus",
  "unknown"
] as const;
const BENCHMARK_REVENUE_BANDS = [
  "under_500k",
  "500k_1m",
  "1m_3m",
  "3m_10m",
  "10m_25m",
  "25m_plus",
  "unknown"
] as const;
const BENCHMARK_TEAM_BANDS = [
  "solo",
  "team_2_5",
  "team_6_15",
  "team_16_50",
  "team_51_plus",
  "unknown"
] as const;
const BENCHMARK_MARKET_SCOPES = [
  "local",
  "multi_county",
  "regional",
  "national",
  "mixed",
  "unknown"
] as const;
const BUSINESS_TYPE_PARENT_MAP: Partial<Record<BusinessTypeSlug, BusinessTypeSlug>> = {
  custom_fabrication: "steel_fabrication",
  freight_hauling: "trucking_logistics",
  last_mile_delivery: "trucking_logistics",
  janitorial_recurring: "commercial_cleaning",
  grounds_maintenance: "landscaping",
  commercial_hvac: "hvac",
  residential_hvac: "hvac",
  specialty_subcontractor: "trade_contractor",
  marketing_agency: "agency_consulting",
  ops_consulting: "agency_consulting",
  job_shop_manufacturing: "manufacturing",
  wholesale_distribution: "distribution",
  auto_service: "retail_local_service",
  medical_practice: "professional_service"
};

type StageValue = typeof STAGE_VALUES[number];
type BusinessTypeSlug = typeof BUSINESS_TYPE_SLUGS[number];
type BusinessModelSlug = typeof BUSINESS_MODEL_SLUGS[number];
type SymptomTagSlug = typeof SYMPTOM_TAG_SLUGS[number];
type CauseTagSlug = typeof CAUSE_TAG_SLUGS[number];
type RecommendationKey = typeof RECOMMENDATION_KEYS[number];
type OperatingArchetypeSlug = typeof OPERATING_ARCHETYPE_SLUGS[number];
type BenchmarkSizeBand = typeof BENCHMARK_SIZE_BANDS[number];
type BenchmarkRevenueBand = typeof BENCHMARK_REVENUE_BANDS[number];
type BenchmarkTeamBand = typeof BENCHMARK_TEAM_BANDS[number];
type BenchmarkMarketScope = typeof BENCHMARK_MARKET_SCOPES[number];

type ConversationMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type RawNormalized = {
  business_type_slug?: unknown;
  business_model_slugs?: unknown;
  symptom_tag_slugs?: unknown;
  cause_tag_slugs?: unknown;
  recommendation_keys?: unknown;
  operating_archetype_slug?: unknown;
  confidence?: unknown;
  benchmark_size_band?: unknown;
  benchmark_revenue_band?: unknown;
  benchmark_team_band?: unknown;
  benchmark_market_scope?: unknown;
  signals?: unknown;
};

type NormalizedPayload = {
  business_type_slug: BusinessTypeSlug | null;
  business_model_slugs: BusinessModelSlug[];
  symptom_tag_slugs: SymptomTagSlug[];
  cause_tag_slugs: CauseTagSlug[];
  recommendation_keys: RecommendationKey[];
  operating_archetype_slug: OperatingArchetypeSlug | null;
  confidence: number | null;
  benchmark_size_band: BenchmarkSizeBand | null;
  benchmark_revenue_band: BenchmarkRevenueBand | null;
  benchmark_team_band: BenchmarkTeamBand | null;
  benchmark_market_scope: BenchmarkMarketScope | null;
  signals: string[];
};

type AgentResponse = {
  session_id: string;
  assistant_message: string;
  stage: StageValue;
  enough_context: boolean;
  cta_ready: boolean;
  extracted: Record<string, unknown>;
  findings: Record<string, unknown> | string | null;
  normalized: NormalizedPayload;
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function normalizeText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9/&+\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: unknown) {
  return normalizeText(value)
    .replace(/[\/&+]/g, " ")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function uniqueList<T>(items: T[]) {
  return Array.from(new Set(items));
}

function asString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean) as string[];
  }
  const single = asString(value);
  return single ? [single] : [];
}

function createSessionId() {
  return `session_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

function createAliasMap(allowed: readonly string[], extras: Record<string, string> = {}) {
  const map: Record<string, string> = {};
  allowed.forEach((slug) => {
    const pretty = slug.replace(/_/g, " ");
    map[slug] = slug;
    map[pretty] = slug;
    map[pretty.replace(/\s+/g, "-")] = slug;
  });
  Object.entries(extras).forEach(([key, value]) => {
    const normalizedKey = normalizeText(key);
    map[normalizedKey] = value;
    map[normalizedKey.replace(/\s+/g, "-")] = value;
    map[slugify(key)] = value;
  });
  return map;
}

const businessTypeAliasMap = createAliasMap(BUSINESS_TYPE_SLUGS, {
  "trucking / logistics": "trucking_logistics",
  "agency / consulting": "agency_consulting",
  "retail / local service": "retail_local_service",
  "general contractor / trade contractor": "trade_contractor",
  "job shop": "job_shop_manufacturing",
  "wholesale distribution": "wholesale_distribution",
  "hvac contractor": "hvac",
  "hvac company": "hvac",
  "commercial hvac contractor": "commercial_hvac",
  "residential hvac contractor": "residential_hvac",
  "b2b service": "professional_service",
  "b2b service company": "professional_service",
  "service company": "professional_service",
  "service business": "professional_service"
});
const businessModelAliasMap = createAliasMap(BUSINESS_MODEL_SLUGS, {
  "office + field": "office_and_field",
  "recurring revenue": "recurring_revenue",
  "project based": "project_based",
  "quote heavy": "quote_heavy",
  "route heavy": "route_heavy",
  "inventory heavy": "inventory_heavy",
  "labor heavy": "labor_heavy",
  "owner led": "owner_led",
  "field service": "field_service",
  "production based": "production_based"
});
const symptomAliasMap = createAliasMap(SYMPTOM_TAG_SLUGS, {
  "owner bottleneck": "owner_bottleneck",
  "busy but unprofitable": "busy_but_unprofitable",
  "weak kpi discipline": "no_kpi_discipline",
  "low visibility": "low_visibility",
  "thin margins": "margin_leak",
  "margins are thin": "margin_leak",
  "inconsistent margins": "margin_leak",
  "margins are inconsistent": "margin_leak",
  "margin variance": "margin_leak",
  "callbacks": "rework",
  "high callbacks": "rework",
  "owner dependence": "owner_bottleneck",
  "founder bottleneck": "owner_bottleneck",
  "everything runs through owner": "owner_bottleneck",
  "everything still runs through me": "owner_bottleneck",
  "runs through me": "owner_bottleneck",
  "decisions wait for owner": "owner_bottleneck",
  "depends too much on me": "owner_bottleneck",
  "approve too many decisions myself": "owner_bottleneck",
  "i still approve too many decisions myself": "owner_bottleneck",
  "reactive operations": "scheduling_chaos",
  "ops reactive": "scheduling_chaos",
  "operations feels reactive": "scheduling_chaos",
  "weak reporting": "low_visibility",
  "reporting is weak": "low_visibility",
  "untrusted numbers": "low_visibility",
  "numbers unreliable": "low_visibility",
  "do not trust numbers": "low_visibility",
  "i do not trust the numbers": "low_visibility",
  "unclear metrics": "no_kpi_discipline"
});
const causeAliasMap = createAliasMap(CAUSE_TAG_SLUGS, {
  "pricing visibility gap": "pricing_visibility_gap",
  "owner centralized decisions": "owner_centralized_decisions",
  "weak cash collection process": "weak_cash_collection_process",
  "owner approvals bottleneck": "owner_centralized_decisions",
  "owner dependence": "owner_centralized_decisions",
  "depends too much on me": "owner_centralized_decisions",
  "everything still runs through me": "owner_centralized_decisions",
  "approve too many decisions myself": "owner_centralized_decisions",
  "i still approve too many decisions myself": "owner_centralized_decisions",
  "nonstandard pricing": "pricing_visibility_gap",
  "pricing is not standardized": "pricing_visibility_gap",
  "pricing inconsistent": "pricing_visibility_gap",
  "reactive operations": "reactive_firefighting",
  "ops reactive": "reactive_firefighting",
  "operations feels reactive": "reactive_firefighting",
  "weak reporting": "weak_metric_discipline",
  "reporting is weak": "weak_metric_discipline",
  "untrusted numbers": "weak_metric_discipline",
  "numbers unreliable": "weak_metric_discipline",
  "do not trust the numbers": "weak_metric_discipline",
  "i do not trust the numbers": "weak_metric_discipline",
  "unclear metrics": "weak_metric_discipline",
  "no operating system": "no_standard_operating_rhythm",
  "no repeatable operating system": "no_standard_operating_rhythm"
});
const recommendationAliasMap = createAliasMap(RECOMMENDATION_KEYS, {
  "build owner handoff lane": "build_owner_handoff_lane",
  "install daily flash kpis": "install_daily_flash_kpis",
  "create go no go job selection rule": "create_gc_pick_rule"
});
const archetypeAliasMap = createAliasMap(OPERATING_ARCHETYPE_SLUGS, {
  "busy but blind": "busy_but_blind",
  "growing but owner locked": "growing_but_owner_locked",
  "selling but underpricing": "selling_but_underpricing",
  "chaotic execution": "chaotic_execution",
  "kpi weak but stable": "kpi_weak_but_stable",
  "demand rich capacity constrained": "demand_rich_capacity_constrained",
  "profitable core weak growth engine": "profitable_core_weak_growth_engine"
});
const sizeBandAliasMap = createAliasMap(BENCHMARK_SIZE_BANDS, {
  "solo or owner led": "solo_or_owner_led",
  "2 5": "small_team_2_5",
  "6 15": "growing_team_6_15",
  "16 50": "scaled_team_16_50",
  "51 plus": "larger_team_51_plus"
});
const revenueBandAliasMap = createAliasMap(BENCHMARK_REVENUE_BANDS, {
  "under 500k": "under_500k",
  "500k 1m": "500k_1m",
  "1m 3m": "1m_3m",
  "3m 10m": "3m_10m",
  "10m 25m": "10m_25m",
  "25m plus": "25m_plus"
});
const teamBandAliasMap = createAliasMap(BENCHMARK_TEAM_BANDS, {
  "2 5": "team_2_5",
  "6 15": "team_6_15",
  "16 50": "team_16_50",
  "51 plus": "team_51_plus"
});
const marketScopeAliasMap = createAliasMap(BENCHMARK_MARKET_SCOPES, {
  "multi county": "multi_county"
});

function mapAllowedSlug<T extends string>(
  value: unknown,
  allowed: readonly T[],
  aliasMap: Record<string, string>
) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if ((allowed as readonly string[]).includes(normalized)) return normalized as T;

  const slugified = slugify(value);
  if ((allowed as readonly string[]).includes(slugified)) return slugified as T;

  if (aliasMap[normalized] && (allowed as readonly string[]).includes(aliasMap[normalized])) {
    return aliasMap[normalized] as T;
  }

  return null;
}

function mapAllowedSlugArray<T extends string>(
  value: unknown,
  allowed: readonly T[],
  aliasMap: Record<string, string>,
  maxItems: number
) {
  const mapped = asStringArray(value)
    .map((entry) => mapAllowedSlug(entry, allowed, aliasMap))
    .filter(Boolean) as T[];
  return uniqueList(mapped).slice(0, maxItems);
}

function sanitizeSignals(value: unknown) {
  const items = asStringArray(value)
    .map((entry) => slugify(entry))
    .filter(Boolean)
    .slice(0, 8);
  return uniqueList(items);
}

function collectStrings(value: unknown, bucket: string[]) {
  if (value == null) return bucket;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const text = String(value).trim();
    if (text) bucket.push(text);
    return bucket;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, bucket));
    return bucket;
  }
  if (typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) => collectStrings(item, bucket));
  }
  return bucket;
}

function extractCandidateStrings(sources: unknown[]) {
  const bucket: string[] = [];
  sources.forEach((value) => collectStrings(value, bucket));
  return uniqueList(
    bucket.flatMap((item) => {
      const text = String(item || "").trim();
      if (!text) return [];
      const parts = text.split(/[;,|]/g).map((part) => part.trim()).filter(Boolean);
      return parts.length ? parts : [text];
    })
  );
}

function sanitizeStage(value: unknown): StageValue {
  const normalized = normalizeText(value);
  if (normalized.includes("find")) return "findings";
  if (normalized.includes("analy")) return "analyze";
  return "discover";
}

function sanitizeConfidence(value: unknown) {
  const numeric = asNumber(value);
  if (numeric == null || numeric <= 0) return null;
  return Number(clamp(numeric, 0, 1).toFixed(2));
}

function sanitizeFindings(value: unknown) {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "object") return value as Record<string, unknown>;
  return null;
}

function sanitizeAssistantMessage(value: unknown) {
  const content = asString(value);
  return content || "I received that, but I do not have a useful reply yet.";
}

function buildNormalizedPayload(value: RawNormalized): NormalizedPayload {
  return {
    business_type_slug: mapAllowedSlug(value.business_type_slug, BUSINESS_TYPE_SLUGS, businessTypeAliasMap),
    business_model_slugs: mapAllowedSlugArray(value.business_model_slugs, BUSINESS_MODEL_SLUGS, businessModelAliasMap, 5),
    symptom_tag_slugs: mapAllowedSlugArray(value.symptom_tag_slugs, SYMPTOM_TAG_SLUGS, symptomAliasMap, 6),
    cause_tag_slugs: mapAllowedSlugArray(value.cause_tag_slugs, CAUSE_TAG_SLUGS, causeAliasMap, 6),
    recommendation_keys: mapAllowedSlugArray(value.recommendation_keys, RECOMMENDATION_KEYS, recommendationAliasMap, 4),
    operating_archetype_slug: mapAllowedSlug(value.operating_archetype_slug, OPERATING_ARCHETYPE_SLUGS, archetypeAliasMap),
    confidence: sanitizeConfidence(value.confidence),
    benchmark_size_band: mapAllowedSlug(value.benchmark_size_band, BENCHMARK_SIZE_BANDS, sizeBandAliasMap),
    benchmark_revenue_band: mapAllowedSlug(value.benchmark_revenue_band, BENCHMARK_REVENUE_BANDS, revenueBandAliasMap),
    benchmark_team_band: mapAllowedSlug(value.benchmark_team_band, BENCHMARK_TEAM_BANDS, teamBandAliasMap),
    benchmark_market_scope: mapAllowedSlug(value.benchmark_market_scope, BENCHMARK_MARKET_SCOPES, marketScopeAliasMap),
    signals: sanitizeSignals(value.signals)
  };
}

function scanCorpusForAllowedSlugs<T extends string>(
  corpus: string,
  allowed: readonly T[],
  aliasMap: Record<string, string>,
  maxItems: number
) {
  if (!corpus) return [];

  const candidates = new Map<string, T>();
  allowed.forEach((slug) => {
    candidates.set(slug, slug);
    candidates.set(slug.replace(/_/g, " "), slug);
  });
  Object.entries(aliasMap).forEach(([key, value]) => {
    if ((allowed as readonly string[]).includes(value)) {
      candidates.set(normalizeText(key), value as T);
    }
  });

  const matches: T[] = [];
  Array.from(candidates.entries())
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([phrase, slug]) => {
      if (phrase && corpus.includes(phrase)) matches.push(slug);
    });

  return uniqueList(matches).slice(0, maxItems);
}

function hasMeaningfulFindings(value: unknown) {
  const findings = sanitizeFindings(value);
  if (!findings) return false;
  if (typeof findings === "string") return Boolean(findings.trim());

  return Object.entries(findings).some(([, item]) => {
    if (typeof item === "string") return Boolean(item.trim());
    if (typeof item === "number" || typeof item === "boolean") return true;
    if (Array.isArray(item)) return item.some((entry) => Boolean(asString(entry)));
    if (item && typeof item === "object") return Object.keys(item).length > 0;
    return false;
  });
}

function sanitizeSignalsWithEvidence(value: unknown, findingsInput: unknown) {
  const signals = sanitizeSignals(value).filter((signal) => {
    if (signal === "findings_ready") return hasMeaningfulFindings(findingsInput);
    return true;
  });
  return uniqueList(signals).slice(0, 8);
}

function normalizeBusinessTypeWithEvidence(
  businessTypeSlug: BusinessTypeSlug | null,
  corpus: string
): BusinessTypeSlug | null {
  if (!businessTypeSlug) return null;
  if (businessTypeSlug === "residential_hvac" && !corpus.includes("residential")) return "hvac";
  if (businessTypeSlug === "commercial_hvac" && !corpus.includes("commercial")) return "hvac";
  return businessTypeSlug;
}

function firstMappedSlug<T extends string>(
  sources: unknown[],
  allowed: readonly T[],
  aliasMap: Record<string, string>
) {
  for (const candidate of extractCandidateStrings(sources)) {
    const mapped = mapAllowedSlug(candidate, allowed, aliasMap);
    if (mapped) return mapped;
  }
  return null;
}

function mappedSlugArray<T extends string>(
  sources: unknown[],
  allowed: readonly T[],
  aliasMap: Record<string, string>,
  maxItems: number
) {
  const mapped = extractCandidateStrings(sources)
    .map((entry) => mapAllowedSlug(entry, allowed, aliasMap))
    .filter(Boolean) as T[];
  return uniqueList(mapped).slice(0, maxItems);
}

function inferSizeBandFromCount(count: number): BenchmarkSizeBand | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  if (count <= 1) return "solo_or_owner_led";
  if (count <= 5) return "small_team_2_5";
  if (count <= 15) return "growing_team_6_15";
  if (count <= 50) return "scaled_team_16_50";
  return "larger_team_51_plus";
}

function inferSizeBandFromSources(sources: unknown[]): BenchmarkSizeBand | null {
  const explicit = firstMappedSlug(sources, BENCHMARK_SIZE_BANDS, sizeBandAliasMap);
  if (explicit) return explicit;

  const corpus = normalizeText(extractCandidateStrings(sources).join(" "));
  const matches = Array.from(corpus.matchAll(/\b(\d{1,3})\s+(?:employees|people|staff|techs|technicians|tech|crew|workers)\b/g));
  const total = matches.reduce((sum, match) => sum + Number(match[1] || 0), 0);
  if (total > 0) return inferSizeBandFromCount(total);

  if (corpus.includes("small team")) return "small_team_2_5";
  if (corpus.includes("solo") || corpus.includes("just me")) return "solo_or_owner_led";
  return null;
}

function inferTeamBandFromSizeBand(sizeBand: BenchmarkSizeBand | null): BenchmarkTeamBand | null {
  switch (sizeBand) {
    case "solo_or_owner_led":
      return "solo";
    case "small_team_2_5":
      return "team_2_5";
    case "growing_team_6_15":
      return "team_6_15";
    case "scaled_team_16_50":
      return "team_16_50";
    case "larger_team_51_plus":
      return "team_51_plus";
    default:
      return null;
  }
}

function inferRevenueBandFromSources(sources: unknown[]): BenchmarkRevenueBand | null {
  const explicit = firstMappedSlug(sources, BENCHMARK_REVENUE_BANDS, revenueBandAliasMap);
  if (explicit) return explicit;

  const corpus = normalizeText(extractCandidateStrings(sources).join(" "));
  const match = corpus.match(/\b(\d+(?:\.\d+)?)\s*(m|mm|million|k|thousand)\b/);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;

  const normalizedAmount = match[2].startsWith("k") || match[2].startsWith("thousand")
    ? amount / 1000
    : amount;

  if (normalizedAmount < 0.5) return "under_500k";
  if (normalizedAmount < 1) return "500k_1m";
  if (normalizedAmount < 3) return "1m_3m";
  if (normalizedAmount < 10) return "3m_10m";
  if (normalizedAmount < 25) return "10m_25m";
  return "25m_plus";
}

function inferBusinessModelSlugs(
  businessTypeSlug: BusinessTypeSlug | null,
  sources: unknown[]
): BusinessModelSlug[] {
  const explicit = mappedSlugArray(sources, BUSINESS_MODEL_SLUGS, businessModelAliasMap, 5);
  const corpus = normalizeText(extractCandidateStrings(sources).join(" "));
  const corpusMatches = scanCorpusForAllowedSlugs(corpus, BUSINESS_MODEL_SLUGS, businessModelAliasMap, 5);
  if (explicit.length > 0 || corpusMatches.length > 0) {
    return uniqueList(explicit.concat(corpusMatches)).slice(0, 5);
  }
  const inferred: BusinessModelSlug[] = [];

  if (
    businessTypeSlug === "hvac"
    || businessTypeSlug === "commercial_hvac"
    || businessTypeSlug === "residential_hvac"
    || businessTypeSlug === "commercial_cleaning"
    || businessTypeSlug === "landscaping"
  ) {
    inferred.push("field_service", "labor_heavy");
  }

  if (businessTypeSlug === "trucking_logistics" || businessTypeSlug === "freight_hauling" || businessTypeSlug === "last_mile_delivery") {
    inferred.push("route_heavy", "labor_heavy");
  }

  if (businessTypeSlug === "general_contractor" || businessTypeSlug === "trade_contractor") {
    inferred.push("project_based", "quote_heavy", "labor_heavy");
  }

  if (businessTypeSlug === "manufacturing" || businessTypeSlug === "steel_fabrication") {
    inferred.push("production_based", "labor_heavy");
  }

  if (corpus.includes("owner") || corpus.includes("founder") || corpus.includes("i own") || corpus.includes("depends too much on me") || corpus.includes("runs through me")) {
    inferred.push("owner_led");
  }
  if (corpus.includes("office staff") || corpus.includes("office")) inferred.push("office_and_field");
  if (corpus.includes("maintenance agreement") || corpus.includes("recurring")) inferred.push("recurring_revenue");

  return uniqueList(inferred).slice(0, 5);
}

function inferOperatingArchetype(
  symptomTags: SymptomTagSlug[],
  causeTags: CauseTagSlug[]
): OperatingArchetypeSlug | null {
  if (symptomTags.includes("owner_bottleneck") || causeTags.includes("owner_centralized_decisions")) {
    return "growing_but_owner_locked";
  }
  if (symptomTags.includes("underpriced_work") || symptomTags.includes("margin_leak") || causeTags.includes("pricing_visibility_gap")) {
    return "selling_but_underpricing";
  }
  if (symptomTags.includes("scheduling_chaos") || symptomTags.includes("rework") || causeTags.includes("reactive_firefighting")) {
    return "chaotic_execution";
  }
  if (symptomTags.includes("low_visibility") || symptomTags.includes("no_kpi_discipline") || causeTags.includes("weak_metric_discipline")) {
    return "busy_but_blind";
  }
  if (symptomTags.includes("capacity_constraint") || causeTags.includes("no_capacity_planning")) {
    return "demand_rich_capacity_constrained";
  }
  return null;
}

function inferRecommendationKeys(
  businessTypeSlug: BusinessTypeSlug | null,
  symptomTags: SymptomTagSlug[],
  causeTags: CauseTagSlug[]
): RecommendationKey[] {
  const inferred: RecommendationKey[] = [];

  if (symptomTags.includes("owner_bottleneck") || causeTags.includes("owner_centralized_decisions")) {
    inferred.push("build_owner_handoff_lane");
  }
  if (symptomTags.includes("margin_leak") || symptomTags.includes("underpriced_work") || causeTags.includes("pricing_visibility_gap")) {
    inferred.push("create_margin_guardrails", "implement_job_costing_review");
  }
  if (symptomTags.includes("rework") || causeTags.includes("weak_scope_alignment")) {
    inferred.push("standardize_scope_sheet", "standardize_closeout_checklist");
  }
  if (symptomTags.includes("low_visibility") || symptomTags.includes("no_kpi_discipline") || causeTags.includes("weak_metric_discipline")) {
    inferred.push("install_daily_flash_kpis");
  }
  if (symptomTags.includes("scheduling_chaos") || causeTags.includes("reactive_firefighting") || causeTags.includes("no_capacity_planning")) {
    inferred.push("set_weekly_capacity_planning");
  }
  if ((businessTypeSlug === "hvac" || businessTypeSlug === "commercial_hvac" || businessTypeSlug === "residential_hvac") && symptomTags.includes("rework")) {
    inferred.unshift("standardize_closeout_checklist");
  }

  return uniqueList(inferred).slice(0, 4);
}

function inferConfidence(
  businessTypeSlug: BusinessTypeSlug | null,
  businessModels: BusinessModelSlug[],
  symptomTags: SymptomTagSlug[],
  causeTags: CauseTagSlug[],
  sizeBand: BenchmarkSizeBand | null
) {
  if (!businessTypeSlug) return null;

  let value = 0.42;
  if (businessModels.length > 0) value += 0.08;
  if (symptomTags.length > 0) value += Math.min(0.18, symptomTags.length * 0.06);
  if (causeTags.length > 0) value += Math.min(0.12, causeTags.length * 0.04);
  if (sizeBand) value += 0.06;

  if (value < 0.5) return null;
  return Number(clamp(value, 0.5, 0.82).toFixed(2));
}

function inferSignals(
  businessTypeSlug: BusinessTypeSlug | null,
  businessModels: BusinessModelSlug[],
  symptomTags: SymptomTagSlug[],
  causeTags: CauseTagSlug[],
  sizeBand: BenchmarkSizeBand | null,
  findingsInput: unknown
) {
  const signals: string[] = [];
  if (businessTypeSlug) signals.push("business_type_identified");
  if (businessModels.includes("field_service")) signals.push("field_service_pattern");
  if (businessModels.includes("owner_led")) signals.push("owner_dependence");
  if (symptomTags.includes("low_visibility") || causeTags.includes("weak_metric_discipline")) signals.push("visibility_gap");
  if (symptomTags.includes("margin_leak") || causeTags.includes("pricing_visibility_gap")) signals.push("margin_pressure");
  if (sizeBand) signals.push("size_band_identified");
  if (hasMeaningfulFindings(findingsInput)) signals.push("findings_ready");
  return uniqueList(signals).slice(0, 8);
}

function backfillNormalizedPayload(
  normalized: NormalizedPayload,
  extractedInput: unknown,
  findingsInput: unknown,
  conversationInput: unknown
): NormalizedPayload {
  const extracted = asObject(extractedInput);
  const findings = asObject(findingsInput);
  const sharedSources = [extracted, findings, conversationInput];
  const corpus = normalizeText(extractCandidateStrings(sharedSources).join(" "));
  const conversationCorpus = normalizeText(extractCandidateStrings([conversationInput]).join(" "));
  const directBusinessType = normalized.business_type_slug || firstMappedSlug(
    [extracted.primary_business_type, extracted.business_type, findings.business_type, conversationInput],
    BUSINESS_TYPE_SLUGS,
    businessTypeAliasMap
  );
  const corpusBusinessType = scanCorpusForAllowedSlugs(conversationCorpus || corpus, BUSINESS_TYPE_SLUGS, businessTypeAliasMap, 1)[0] || null;
  const businessTypeSlug = normalizeBusinessTypeWithEvidence(
    directBusinessType || corpusBusinessType,
    conversationCorpus || corpus
  );
  const inferredBusinessModels = inferBusinessModelSlugs(businessTypeSlug, [
    extracted.business_model,
    extracted.business_models,
    extracted.business_model_tags,
    findings.business_model,
    findings.business_models,
    ...sharedSources
  ]);
  const businessModelSlugs = uniqueList(
    normalized.business_model_slugs.concat(inferredBusinessModels)
  ).slice(0, 5);
  const inferredSymptomTags = uniqueList(
    mappedSlugArray(
      [extracted.symptom_tags, extracted.symptoms, extracted.pain_points, findings.symptom_tags, ...sharedSources],
      SYMPTOM_TAG_SLUGS,
      symptomAliasMap,
      6
    ).concat(
      scanCorpusForAllowedSlugs(corpus, SYMPTOM_TAG_SLUGS, symptomAliasMap, 6)
    )
  ).slice(0, 6);
  const symptomTagSlugs = uniqueList(
    normalized.symptom_tag_slugs.concat(inferredSymptomTags)
  ).slice(0, 6);
  const inferredCauseTags = uniqueList(
    mappedSlugArray(
      [extracted.cause_tags, extracted.inferred_causes, findings.cause_tags, extracted.symptoms, extracted.pain_points, ...sharedSources],
      CAUSE_TAG_SLUGS,
      causeAliasMap,
      6
    ).concat(
      scanCorpusForAllowedSlugs(corpus, CAUSE_TAG_SLUGS, causeAliasMap, 6)
    )
  ).slice(0, 6);
  const causeTagSlugs = uniqueList(
    normalized.cause_tag_slugs.concat(inferredCauseTags)
  ).slice(0, 6);
  const sizeBand = normalized.benchmark_size_band || inferSizeBandFromSources([
    extracted.benchmark_size_band,
    extracted.size_band,
    extracted.team_size,
    extracted.employee_band,
    extracted,
    findings,
    conversationInput
  ]);

  return {
    business_type_slug: businessTypeSlug,
    business_model_slugs: businessModelSlugs,
    symptom_tag_slugs: symptomTagSlugs,
    cause_tag_slugs: causeTagSlugs,
    recommendation_keys: uniqueList(
      normalized.recommendation_keys.concat(
        inferRecommendationKeys(businessTypeSlug, symptomTagSlugs, causeTagSlugs)
      )
    ).slice(0, 4),
    operating_archetype_slug: normalized.operating_archetype_slug || inferOperatingArchetype(symptomTagSlugs, causeTagSlugs),
    confidence: normalized.confidence ?? inferConfidence(businessTypeSlug, businessModelSlugs, symptomTagSlugs, causeTagSlugs, sizeBand),
    benchmark_size_band: sizeBand,
    benchmark_revenue_band: normalized.benchmark_revenue_band || inferRevenueBandFromSources([
      extracted.benchmark_revenue_band,
      extracted.revenue_band,
      extracted.annual_revenue,
      extracted.revenue,
      extracted,
      findings,
      conversationInput
    ]),
    benchmark_team_band: normalized.benchmark_team_band || inferTeamBandFromSizeBand(sizeBand),
    benchmark_market_scope: normalized.benchmark_market_scope || firstMappedSlug(
      [extracted.benchmark_market_scope, extracted.market_scope, extracted.service_area, findings.market_scope, conversationInput],
      BENCHMARK_MARKET_SCOPES,
      marketScopeAliasMap
    ),
    signals: uniqueList(
      sanitizeSignalsWithEvidence(normalized.signals, findingsInput).concat(
        inferSignals(businessTypeSlug, businessModelSlugs, symptomTagSlugs, causeTagSlugs, sizeBand, findingsInput)
      )
    ).slice(0, 8)
  };
}

function enrichExtracted(
  extractedInput: unknown,
  normalized: NormalizedPayload
) {
  const extracted = asObject(extractedInput);
  const businessModel = normalized.business_model_slugs[0] || null;

  return {
    ...extracted,
    business_type: extracted.business_type || normalized.business_type_slug,
    primary_business_type: extracted.primary_business_type || normalized.business_type_slug,
    business_model: extracted.business_model || businessModel,
    business_model_tags:
      (Array.isArray(extracted.business_model_tags) && extracted.business_model_tags.length > 0)
        ? extracted.business_model_tags
        : normalized.business_model_slugs,
    symptom_tags:
      (Array.isArray(extracted.symptom_tags) && extracted.symptom_tags.length > 0)
        ? extracted.symptom_tags
        : normalized.symptom_tag_slugs,
    cause_tags:
      (Array.isArray(extracted.cause_tags) && extracted.cause_tags.length > 0)
        ? extracted.cause_tags
        : normalized.cause_tag_slugs,
    inferred_causes:
      (Array.isArray(extracted.inferred_causes) && extracted.inferred_causes.length > 0)
        ? extracted.inferred_causes
        : normalized.cause_tag_slugs,
    recommendation_ids:
      (Array.isArray(extracted.recommendation_ids) && extracted.recommendation_ids.length > 0)
        ? extracted.recommendation_ids
        : normalized.recommendation_keys,
    operating_archetype: extracted.operating_archetype || normalized.operating_archetype_slug,
    confidence:
      extracted.confidence != null
        ? extracted.confidence
        : normalized.confidence,
    benchmark_size_band: extracted.benchmark_size_band || normalized.benchmark_size_band,
    benchmark_revenue_band: extracted.benchmark_revenue_band || normalized.benchmark_revenue_band,
    benchmark_team_band: extracted.benchmark_team_band || normalized.benchmark_team_band,
    benchmark_market_scope: extracted.benchmark_market_scope || normalized.benchmark_market_scope,
    signals:
      (Array.isArray(extracted.signals) && extracted.signals.length > 0)
        ? extracted.signals
        : normalized.signals
  };
}

function enrichFindings(findingsInput: unknown, normalized: NormalizedPayload) {
  const findings = sanitizeFindings(findingsInput);
  if (!hasMeaningfulFindings(findings)) return null;
  if (typeof findings === "string") return findings;

  return {
    ...findings,
    business_type: findings.business_type || normalized.business_type_slug,
    symptom_tags:
      (Array.isArray(findings.symptom_tags) && findings.symptom_tags.length > 0)
        ? findings.symptom_tags
        : normalized.symptom_tag_slugs,
    cause_tags:
      (Array.isArray(findings.cause_tags) && findings.cause_tags.length > 0)
        ? findings.cause_tags
        : normalized.cause_tag_slugs,
    recommendation_ids:
      (Array.isArray(findings.recommendation_ids) && findings.recommendation_ids.length > 0)
        ? findings.recommendation_ids
        : normalized.recommendation_keys,
    operating_archetype: findings.operating_archetype || normalized.operating_archetype_slug
  };
}

function sanitizeConversation(input: unknown) {
  if (!Array.isArray(input)) return [];

  return input
    .map((entry) => {
      const item = asObject(entry);
      const role = asString(item.role);
      const content = asString(item.content);
      if (!role || !content) return null;
      if (role !== "system" && role !== "user" && role !== "assistant") return null;
      return { role, content } as ConversationMessage;
    })
    .filter(Boolean) as ConversationMessage[];
}

function buildSystemPrompt(publicSystemMessages: string[]) {
  return [
    "You are the backend business diagnostic agent for Operational Clarity.",
    "Preserve the public conversational tone and brevity constraints from the existing product.",
    "Return valid JSON only.",
    "Keep the public fields stable: assistant_message, stage, enough_context, cta_ready, findings, extracted.",
    "Add a top-level normalized object that uses controlled taxonomy slugs and benchmark bucket slugs.",
    "Business type must be selected first before problem buckets whenever enough evidence exists.",
    "If evidence is weak, leave normalized fields null or empty rather than inventing confidence.",
    "assistant_message stays human, plainspoken, and useful.",
    "Before enough_context is true, ask one focused next-best question and keep the answer short.",
    "When enough_context is true, assistant_message should add insight with this structure: Quick read:, What this likely means:, What to do first:.",
    "Do not expose internal schema talk in assistant_message.",
    "",
    "Allowed stage values:",
    JSON.stringify(STAGE_VALUES),
    "",
    "Allowed normalized.business_type_slug values:",
    JSON.stringify(BUSINESS_TYPE_SLUGS),
    "",
    "Allowed normalized.business_model_slugs values:",
    JSON.stringify(BUSINESS_MODEL_SLUGS),
    "",
    "Allowed normalized.symptom_tag_slugs values:",
    JSON.stringify(SYMPTOM_TAG_SLUGS),
    "",
    "Allowed normalized.cause_tag_slugs values:",
    JSON.stringify(CAUSE_TAG_SLUGS),
    "",
    "Allowed normalized.recommendation_keys values:",
    JSON.stringify(RECOMMENDATION_KEYS),
    "",
    "Allowed normalized.operating_archetype_slug values:",
    JSON.stringify(OPERATING_ARCHETYPE_SLUGS),
    "",
    "Allowed normalized.benchmark_size_band values:",
    JSON.stringify(BENCHMARK_SIZE_BANDS),
    "",
    "Allowed normalized.benchmark_revenue_band values:",
    JSON.stringify(BENCHMARK_REVENUE_BANDS),
    "",
    "Allowed normalized.benchmark_team_band values:",
    JSON.stringify(BENCHMARK_TEAM_BANDS),
    "",
    "Allowed normalized.benchmark_market_scope values:",
    JSON.stringify(BENCHMARK_MARKET_SCOPES),
    "",
    "normalized.signals should be an array of short machine-friendly slug strings drawn from evidence in the conversation.",
    "",
    "JSON response shape:",
    JSON.stringify({
      assistant_message: "string",
      stage: "discover | analyze | findings",
      enough_context: true,
      cta_ready: false,
      extracted: {
        business_type: "string or slug",
        main_problem: "string",
        pain_points: ["string"],
        symptoms: ["string"],
        strengths: ["string"]
      },
      findings: {
        summary: "string",
        main_issue: "string",
        priority: "string",
        first_focus: "string",
        next_step: "string",
        recommendations: ["string"]
      },
      normalized: {
        business_type_slug: "allowed slug or null",
        business_model_slugs: ["allowed slug"],
        symptom_tag_slugs: ["allowed slug"],
        cause_tag_slugs: ["allowed slug"],
        recommendation_keys: ["allowed key"],
        operating_archetype_slug: "allowed slug or null",
        confidence: 0.72,
        benchmark_size_band: "allowed slug or null",
        benchmark_revenue_band: "allowed slug or null",
        benchmark_team_band: "allowed slug or null",
        benchmark_market_scope: "allowed slug or null",
        signals: ["short_signal_slug"]
      }
    }, null, 2),
    publicSystemMessages.length
      ? `\nExisting public voice instructions:\n${publicSystemMessages.join("\n\n")}`
      : ""
  ].join("\n");
}

async function callOpenAI(messages: ConversationMessage[]) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set for business-diagnostic-agent.");
  }

  const model = Deno.env.get("OPENAI_MODEL") || DEFAULT_OPENAI_MODEL;
  const baseUrl = Deno.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages
      }),
      signal: controller.signal
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message || `OpenAI request failed with status ${response.status}.`);
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("OpenAI response did not include JSON content.");
    }

    return JSON.parse(content);
  } finally {
    clearTimeout(timeoutId);
  }
}

function sanitizeAgentPayload(sessionId: string, rawPayload: unknown, conversationInput: unknown): AgentResponse {
  const payload = asObject(rawPayload);
  const normalized = backfillNormalizedPayload(
    buildNormalizedPayload(asObject(payload.normalized) as RawNormalized),
    payload.extracted,
    payload.findings,
    conversationInput
  );
  const extracted = enrichExtracted(payload.extracted, normalized);
  const findings = enrichFindings(payload.findings, normalized);

  return {
    session_id: sessionId,
    assistant_message: sanitizeAssistantMessage(payload.assistant_message),
    stage: sanitizeStage(payload.stage),
    enough_context: asBoolean(payload.enough_context),
    cta_ready: asBoolean(payload.cta_ready),
    extracted,
    findings,
    normalized
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  try {
    const body = await request.json();
    const payload = asObject(body);
    const incomingConversation = sanitizeConversation(payload.conversation);
    const sessionId = asString(payload.session_id) || createSessionId();

    if (!incomingConversation.length) {
      return jsonResponse(400, { error: "conversation is required." });
    }

    const publicSystemMessages = incomingConversation
      .filter((message) => message.role === "system")
      .map((message) => message.content);
    const conversationalMessages = incomingConversation.filter((message) => message.role !== "system");

    const systemPrompt = buildSystemPrompt(publicSystemMessages);
    const openAiMessages: ConversationMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationalMessages
    ];

    const rawModelPayload = await callOpenAI(openAiMessages);
    const responsePayload = sanitizeAgentPayload(sessionId, rawModelPayload, incomingConversation);

    return jsonResponse(200, responsePayload);
  } catch (error) {
    console.error("business-diagnostic-agent failed", error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "The diagnostic agent failed."
    });
  }
});
