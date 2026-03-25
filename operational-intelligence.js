(function (window) {
  const SCHEMA_VERSION = "2026-03-24-phase1-intelligence-v1";

  const BUSINESS_TYPES = [
    {
      slug: "steel_fabrication",
      label: "Steel fabrication",
      level: "primary",
      keywords: ["steel fabrication", "metal fabrication", "fab shop", "welding shop", "structural steel", "fabrication shop"]
    },
    {
      slug: "custom_fabrication",
      label: "Custom fabrication",
      level: "secondary",
      parent: "steel_fabrication",
      keywords: ["custom fabrication", "job shop fabrication", "made to order metal", "custom metal"]
    },
    {
      slug: "trucking_logistics",
      label: "Trucking / logistics",
      level: "primary",
      keywords: ["trucking", "logistics", "freight", "carrier", "fleet", "dispatch", "route planning"]
    },
    {
      slug: "freight_hauling",
      label: "Freight hauling",
      level: "secondary",
      parent: "trucking_logistics",
      keywords: ["hauling", "freight hauling", "flatbed", "semi", "otr", "regional routes"]
    },
    {
      slug: "last_mile_delivery",
      label: "Last-mile delivery",
      level: "secondary",
      parent: "trucking_logistics",
      keywords: ["last mile", "delivery routes", "local delivery", "route stops"]
    },
    {
      slug: "commercial_cleaning",
      label: "Commercial cleaning",
      level: "primary",
      keywords: ["commercial cleaning", "janitorial", "cleaning contracts", "facility cleaning", "office cleaning"]
    },
    {
      slug: "janitorial_recurring",
      label: "Janitorial recurring service",
      level: "secondary",
      parent: "commercial_cleaning",
      keywords: ["janitorial recurring", "night cleaning", "cleaning crews", "recurring cleaning"]
    },
    {
      slug: "landscaping",
      label: "Landscaping",
      level: "primary",
      keywords: ["landscaping", "lawn care", "grounds maintenance", "irrigation", "snow removal"]
    },
    {
      slug: "grounds_maintenance",
      label: "Grounds maintenance",
      level: "secondary",
      parent: "landscaping",
      keywords: ["grounds maintenance", "property maintenance", "lawn routes", "mowing crews"]
    },
    {
      slug: "hvac",
      label: "HVAC",
      level: "primary",
      keywords: ["hvac", "heating and cooling", "service calls", "mechanical contractor", "comfort systems"]
    },
    {
      slug: "commercial_hvac",
      label: "Commercial HVAC",
      level: "secondary",
      parent: "hvac",
      keywords: ["commercial hvac", "rooftop unit", "rtu", "mechanical service", "tenant improvement hvac"]
    },
    {
      slug: "residential_hvac",
      label: "Residential HVAC",
      level: "secondary",
      parent: "hvac",
      keywords: ["residential hvac", "home comfort", "replacement systems", "service agreement"]
    },
    {
      slug: "general_contractor",
      label: "General contractor",
      level: "primary",
      keywords: ["general contractor", "gc", "construction management", "build out", "project superintendent"]
    },
    {
      slug: "trade_contractor",
      label: "Trade contractor",
      level: "primary",
      keywords: ["subcontractor", "trade contractor", "specialty contractor", "electrical contractor", "plumbing contractor"]
    },
    {
      slug: "specialty_subcontractor",
      label: "Specialty subcontractor",
      level: "secondary",
      parent: "trade_contractor",
      keywords: ["specialty subcontractor", "framing crew", "drywall crew", "concrete crew", "site work contractor"]
    },
    {
      slug: "agency_consulting",
      label: "Agency / consulting",
      level: "primary",
      keywords: ["agency", "consulting", "consultancy", "client services", "retainer work", "creative services"]
    },
    {
      slug: "marketing_agency",
      label: "Marketing agency",
      level: "secondary",
      parent: "agency_consulting",
      keywords: ["marketing agency", "lead gen agency", "creative agency", "paid media", "seo clients"]
    },
    {
      slug: "ops_consulting",
      label: "Operations consulting",
      level: "secondary",
      parent: "agency_consulting",
      keywords: ["operations consulting", "fractional ops", "process consulting", "advisory work"]
    },
    {
      slug: "manufacturing",
      label: "Manufacturing",
      level: "primary",
      keywords: ["manufacturing", "plant", "production floor", "assembly line", "made in house", "factory"]
    },
    {
      slug: "job_shop_manufacturing",
      label: "Job shop manufacturing",
      level: "secondary",
      parent: "manufacturing",
      keywords: ["job shop", "custom manufacturing", "short run", "high mix low volume"]
    },
    {
      slug: "distribution",
      label: "Distribution",
      level: "primary",
      keywords: ["distribution", "wholesale", "warehouse", "inventory turns", "fulfillment"]
    },
    {
      slug: "wholesale_distribution",
      label: "Wholesale distribution",
      level: "secondary",
      parent: "distribution",
      keywords: ["wholesale distribution", "industrial supply", "warehouse fulfillment", "inventory stock"]
    },
    {
      slug: "retail_local_service",
      label: "Retail / local service",
      level: "primary",
      keywords: ["retail", "storefront", "shop", "local service", "service business", "walk-in customers"]
    },
    {
      slug: "auto_service",
      label: "Auto service",
      level: "secondary",
      parent: "retail_local_service",
      keywords: ["auto shop", "repair shop", "service bay", "mechanic shop"]
    },
    {
      slug: "professional_service",
      label: "Professional service",
      level: "primary",
      keywords: ["professional service", "law firm", "accounting firm", "bookkeeping", "medical practice", "engineering firm"]
    },
    {
      slug: "medical_practice",
      label: "Medical practice",
      level: "secondary",
      parent: "professional_service",
      keywords: ["medical practice", "clinic", "dental office", "patient volume"]
    },
    {
      slug: "other",
      label: "Other",
      level: "primary",
      keywords: ["other", "miscellaneous", "general business"]
    }
  ];

  const BUSINESS_MODELS = [
    { slug: "project_based", label: "Project-based", keywords: ["project based", "projects", "job by job", "one-off project"] },
    { slug: "recurring_revenue", label: "Recurring revenue", keywords: ["recurring revenue", "subscription", "maintenance agreement", "monthly contract", "retainer"] },
    { slug: "quote_heavy", label: "Quote-heavy", keywords: ["quotes", "estimating", "bids", "rfq", "proposal"] },
    { slug: "route_heavy", label: "Route-heavy", keywords: ["routes", "stops", "dispatch", "route density", "fleet"] },
    { slug: "inventory_heavy", label: "Inventory-heavy", keywords: ["inventory", "stock", "warehouse", "sku", "fulfillment"] },
    { slug: "labor_heavy", label: "Labor-heavy", keywords: ["crews", "labor", "field labor", "technicians", "installers"] },
    { slug: "owner_led", label: "Owner-led", keywords: ["owner led", "depends on me", "owner does everything", "owner bottleneck"] },
    { slug: "field_service", label: "Field service", keywords: ["field service", "service calls", "techs in the field", "dispatch board"] },
    { slug: "office_and_field", label: "Office + field", keywords: ["office and field", "office staff and crews", "ops office", "dispatch and field"] },
    { slug: "transactional", label: "Transactional", keywords: ["transactional", "walk-in", "point of sale", "one-time purchase"] },
    { slug: "production_based", label: "Production-based", keywords: ["production based", "throughput", "production schedule", "line output"] }
  ];

  const SYMPTOM_TAGS = [
    { slug: "low_win_rate", label: "Low win rate", keywords: ["low win rate", "not winning enough", "close rate", "losing bids", "low hit rate"] },
    { slug: "busy_but_unprofitable", label: "Busy but unprofitable", keywords: ["busy but unprofitable", "busy but not making money", "revenue up profit down", "working hard for no margin"] },
    { slug: "owner_bottleneck", label: "Owner bottleneck", keywords: ["owner bottleneck", "depends on me", "everything comes to me", "owner has to approve everything", "owner stuck in the middle"] },
    { slug: "scheduling_chaos", label: "Scheduling chaos", keywords: ["schedule is chaos", "scheduling chaos", "constantly reshuffling", "dispatch chaos", "calendar is reactive"] },
    { slug: "cash_flow_pressure", label: "Cash flow pressure", keywords: ["cash flow", "slow pay", "can't make payroll", "cash is tight", "collections are slow"] },
    { slug: "backlog_instability", label: "Backlog instability", keywords: ["backlog swings", "pipeline is lumpy", "feast or famine", "inconsistent backlog"] },
    { slug: "low_visibility", label: "Low visibility", keywords: ["no visibility", "can't see", "unclear numbers", "don't know job status", "flying blind"] },
    { slug: "rework", label: "Rework", keywords: ["rework", "redoing work", "mistakes", "quality misses", "callbacks"] },
    { slug: "slow_collections", label: "Slow collections", keywords: ["slow collections", "aging receivables", "late payments", "ar is slow"] },
    { slug: "team_dependency", label: "Team dependency", keywords: ["key employee", "one person knows everything", "team dependency", "single point of failure"] },
    { slug: "underpriced_work", label: "Underpriced work", keywords: ["underpriced", "pricing too low", "not charging enough", "margin is thin", "cheap bids"] },
    { slug: "inconsistent_follow_through", label: "Inconsistent follow-through", keywords: ["follow through", "things slip", "dropped balls", "not following up", "inconsistent execution"] },
    { slug: "weak_handoff", label: "Weak handoff", keywords: ["handoff problem", "sales to ops handoff", "handoffs break", "scope gets lost"] },
    { slug: "capacity_constraint", label: "Capacity constrained", keywords: ["capacity constrained", "can't keep up", "too much demand", "not enough crew", "overloaded"] },
    { slug: "demand_uncertainty", label: "Demand uncertainty", keywords: ["demand uncertainty", "pipeline unpredictable", "demand swings", "not enough leads"] },
    { slug: "scope_creep", label: "Scope creep", keywords: ["scope creep", "extra work", "job runs over", "scope unclear"] },
    { slug: "margin_leak", label: "Margin leak", keywords: ["margin leak", "margin erosion", "profit leak", "cost creep"] },
    { slug: "dispatch_noise", label: "Dispatch noise", keywords: ["dispatch noise", "route changes", "constant phone calls", "crew rescheduling"] },
    { slug: "no_kpi_discipline", label: "Weak KPI discipline", keywords: ["no kpis", "not tracking", "no scorecard", "numbers are stale", "weak metrics"] },
    { slug: "sales_pipeline_gap", label: "Sales pipeline gap", keywords: ["pipeline gap", "lead flow issue", "not enough qualified leads", "weak sales pipeline"] }
  ];

  const CAUSE_TAGS = [
    { slug: "poor_bid_selection", label: "Poor bid selection", keywords: ["wrong bids", "bad fit jobs", "chasing everything", "poor bid selection"] },
    { slug: "weak_scope_alignment", label: "Weak scope alignment", keywords: ["scope unclear", "bad handoff", "scope mismatch", "weak scope alignment"] },
    { slug: "pricing_visibility_gap", label: "Pricing visibility gap", keywords: ["pricing visibility", "don't know margins", "pricing guesswork", "job costing missing"] },
    { slug: "owner_centralized_decisions", label: "Owner-centralized decisions", keywords: ["owner decides everything", "owner approval", "centralized decisions", "all roads lead to owner"] },
    { slug: "no_capacity_planning", label: "No capacity planning", keywords: ["no capacity planning", "overbooked", "crew loading", "can't plan crews"] },
    { slug: "weak_dispatch_system", label: "Weak dispatch system", keywords: ["weak dispatch", "dispatch on text messages", "no routing system", "manual dispatch"] },
    { slug: "poor_job_costing", label: "Poor job costing", keywords: ["no job costing", "job costs unclear", "cost tracking missing", "actual vs estimate missing"] },
    { slug: "inconsistent_process_adherence", label: "Inconsistent process adherence", keywords: ["process not followed", "everybody does it differently", "inconsistent execution"] },
    { slug: "unclear_roles", label: "Unclear roles", keywords: ["unclear roles", "people step on each other", "role confusion", "nobody owns it"] },
    { slug: "missing_forecasting", label: "Missing forecasting", keywords: ["no forecast", "can't see ahead", "forecasting missing", "reactive planning"] },
    { slug: "fragmented_tooling", label: "Fragmented tooling", keywords: ["too many spreadsheets", "systems don't talk", "fragmented tools", "manual handoffs"] },
    { slug: "weak_metric_discipline", label: "Weak metric discipline", keywords: ["weak metric discipline", "not measuring", "no scorecard", "lagging numbers"] },
    { slug: "reactive_firefighting", label: "Reactive firefighting", keywords: ["reactive", "firefighting", "always in reaction mode", "urgent all day"] },
    { slug: "labor_mismatch", label: "Labor mismatch", keywords: ["wrong labor mix", "not enough skilled people", "crew mismatch", "undertrained staff"] },
    { slug: "weak_sales_qualification", label: "Weak sales qualification", keywords: ["bad leads", "weak qualification", "quoting bad prospects", "unqualified pipeline"] },
    { slug: "no_standard_operating_rhythm", label: "No standard operating rhythm", keywords: ["no weekly rhythm", "no regular review", "meeting cadence missing", "operating rhythm"] },
    { slug: "weak_cash_collection_process", label: "Weak cash collection process", keywords: ["collections process weak", "late receivables", "follow-up on invoices is weak"] }
  ];

  const OPERATING_ARCHETYPES = [
    { slug: "busy_but_blind", label: "Busy but blind" },
    { slug: "growing_but_owner_locked", label: "Growing but owner locked" },
    { slug: "selling_but_underpricing", label: "Selling but underpricing" },
    { slug: "chaotic_execution", label: "Chaotic execution" },
    { slug: "kpi_weak_but_stable", label: "KPI weak but stable" },
    { slug: "demand_rich_capacity_constrained", label: "Demand rich, capacity constrained" },
    { slug: "profitable_core_weak_growth_engine", label: "Profitable core, weak growth engine" }
  ];

  const RECOMMENDATION_LIBRARY = [
    {
      id: "create_gc_pick_rule",
      slug: "create_gc_pick_rule",
      title: "Create a go / no-go job selection rule",
      category: "sales",
      description: "Define a short qualification rule so the team stops pursuing jobs that do not fit margin, scope, or capacity.",
      applies_to_business_types: ["general_contractor", "trade_contractor", "steel_fabrication", "manufacturing", "agency_consulting"],
      addresses_symptoms: ["low_win_rate", "busy_but_unprofitable", "backlog_instability"],
      related_causes: ["poor_bid_selection", "weak_sales_qualification"],
      expected_impact: "Higher hit rate and fewer low-fit jobs",
      difficulty_level: "medium",
      time_horizon: "2-4 weeks"
    },
    {
      id: "standardize_scope_sheet",
      slug: "standardize_scope_sheet",
      title: "Standardize the scope sheet and handoff packet",
      category: "delivery",
      description: "Use a shared scope capture template so sales, operations, and field teams start with the same job assumptions.",
      applies_to_business_types: ["general_contractor", "trade_contractor", "hvac", "steel_fabrication", "agency_consulting"],
      addresses_symptoms: ["weak_handoff", "scope_creep", "rework"],
      related_causes: ["weak_scope_alignment", "unclear_roles"],
      expected_impact: "Fewer surprises and cleaner project starts",
      difficulty_level: "medium",
      time_horizon: "1-3 weeks"
    },
    {
      id: "track_hit_rate_by_scope",
      slug: "track_hit_rate_by_scope",
      title: "Track hit rate by scope and customer type",
      category: "sales",
      description: "Segment wins and losses by work type so pricing and qualification decisions can improve over time.",
      applies_to_business_types: ["general_contractor", "trade_contractor", "agency_consulting", "professional_service", "steel_fabrication"],
      addresses_symptoms: ["low_win_rate", "sales_pipeline_gap"],
      related_causes: ["poor_bid_selection", "weak_sales_qualification"],
      expected_impact: "Clearer targeting and better quoting decisions",
      difficulty_level: "medium",
      time_horizon: "2-6 weeks"
    },
    {
      id: "implement_job_costing_review",
      slug: "implement_job_costing_review",
      title: "Implement a weekly job costing review",
      category: "margin",
      description: "Compare estimate versus actual labor, material, and change-order performance on active jobs.",
      applies_to_business_types: ["steel_fabrication", "manufacturing", "general_contractor", "trade_contractor", "hvac"],
      addresses_symptoms: ["busy_but_unprofitable", "margin_leak", "underpriced_work"],
      related_causes: ["pricing_visibility_gap", "poor_job_costing"],
      expected_impact: "Faster margin corrections and better pricing visibility",
      difficulty_level: "medium",
      time_horizon: "1-4 weeks"
    },
    {
      id: "build_owner_handoff_lane",
      slug: "build_owner_handoff_lane",
      title: "Build an owner handoff lane",
      category: "leadership",
      description: "Define which decisions must stay with the owner and which can move to the team with clear rules.",
      applies_to_business_types: ["hvac", "landscaping", "commercial_cleaning", "agency_consulting", "professional_service", "trade_contractor"],
      addresses_symptoms: ["owner_bottleneck", "team_dependency", "inconsistent_follow_through"],
      related_causes: ["owner_centralized_decisions", "unclear_roles"],
      expected_impact: "More delegation without losing control",
      difficulty_level: "high",
      time_horizon: "3-8 weeks"
    },
    {
      id: "set_weekly_capacity_planning",
      slug: "set_weekly_capacity_planning",
      title: "Set a weekly capacity planning cadence",
      category: "operations",
      description: "Review demand, labor, and schedule loading every week before the work becomes a fire drill.",
      applies_to_business_types: ["hvac", "landscaping", "commercial_cleaning", "trucking_logistics", "general_contractor", "trade_contractor"],
      addresses_symptoms: ["capacity_constraint", "scheduling_chaos", "backlog_instability"],
      related_causes: ["no_capacity_planning", "missing_forecasting"],
      expected_impact: "Better crew loading and fewer emergency reschedules",
      difficulty_level: "medium",
      time_horizon: "1-2 weeks"
    },
    {
      id: "launch_dispatch_board",
      slug: "launch_dispatch_board",
      title: "Launch a simple dispatch board",
      category: "operations",
      description: "Use one shared board for routes, appointments, crew status, and schedule changes.",
      applies_to_business_types: ["trucking_logistics", "hvac", "landscaping", "commercial_cleaning"],
      addresses_symptoms: ["dispatch_noise", "scheduling_chaos", "low_visibility"],
      related_causes: ["weak_dispatch_system", "fragmented_tooling"],
      expected_impact: "Less routing chaos and clearer daily execution",
      difficulty_level: "low",
      time_horizon: "1-2 weeks"
    },
    {
      id: "create_margin_guardrails",
      slug: "create_margin_guardrails",
      title: "Create pricing and margin guardrails",
      category: "margin",
      description: "Set floor rules for gross margin, labor assumptions, and change-order triggers before work is quoted.",
      applies_to_business_types: ["general_contractor", "trade_contractor", "hvac", "steel_fabrication", "professional_service"],
      addresses_symptoms: ["underpriced_work", "busy_but_unprofitable", "margin_leak"],
      related_causes: ["pricing_visibility_gap", "poor_job_costing"],
      expected_impact: "Fewer low-margin jobs and faster pricing decisions",
      difficulty_level: "medium",
      time_horizon: "1-3 weeks"
    },
    {
      id: "define_role_scoreboards",
      slug: "define_role_scoreboards",
      title: "Define role scoreboards",
      category: "management",
      description: "Give each core role a few measurable outcomes so coaching and accountability can happen on facts instead of memory.",
      applies_to_business_types: ["agency_consulting", "professional_service", "hvac", "commercial_cleaning", "landscaping", "manufacturing"],
      addresses_symptoms: ["team_dependency", "no_kpi_discipline", "inconsistent_follow_through"],
      related_causes: ["unclear_roles", "weak_metric_discipline"],
      expected_impact: "Clearer accountability and better day-to-day follow-through",
      difficulty_level: "medium",
      time_horizon: "2-4 weeks"
    },
    {
      id: "standardize_closeout_checklist",
      slug: "standardize_closeout_checklist",
      title: "Standardize the closeout checklist",
      category: "delivery",
      description: "Use one end-of-job checklist for documentation, billing, punch items, and customer communication.",
      applies_to_business_types: ["general_contractor", "trade_contractor", "hvac", "steel_fabrication", "professional_service"],
      addresses_symptoms: ["rework", "weak_handoff", "slow_collections"],
      related_causes: ["inconsistent_process_adherence", "weak_scope_alignment"],
      expected_impact: "Cleaner finish, faster billing, fewer dropped details",
      difficulty_level: "low",
      time_horizon: "1-2 weeks"
    },
    {
      id: "set_collections_cadence",
      slug: "set_collections_cadence",
      title: "Set a collections cadence",
      category: "cash",
      description: "Create a recurring invoice follow-up routine with named ownership and aging thresholds.",
      applies_to_business_types: ["general_contractor", "trade_contractor", "professional_service", "commercial_cleaning", "distribution"],
      addresses_symptoms: ["cash_flow_pressure", "slow_collections"],
      related_causes: ["weak_cash_collection_process", "unclear_roles"],
      expected_impact: "Faster cash conversion and fewer aged receivables",
      difficulty_level: "low",
      time_horizon: "1-2 weeks"
    },
    {
      id: "install_daily_flash_kpis",
      slug: "install_daily_flash_kpis",
      title: "Install a daily flash KPI sheet",
      category: "visibility",
      description: "Track a short daily scorecard for schedule health, capacity, cash, and margin signals.",
      applies_to_business_types: ["hvac", "landscaping", "commercial_cleaning", "manufacturing", "distribution", "trucking_logistics"],
      addresses_symptoms: ["low_visibility", "no_kpi_discipline", "busy_but_unprofitable"],
      related_causes: ["weak_metric_discipline", "fragmented_tooling"],
      expected_impact: "Faster visibility and fewer surprises",
      difficulty_level: "low",
      time_horizon: "1-2 weeks"
    },
    {
      id: "segment_customers_by_fit",
      slug: "segment_customers_by_fit",
      title: "Segment customers by fit and profitability",
      category: "strategy",
      description: "Separate strong-fit work from distracting work so sales and operations can focus on the healthiest part of the business.",
      applies_to_business_types: ["agency_consulting", "professional_service", "general_contractor", "trade_contractor", "distribution"],
      addresses_symptoms: ["busy_but_unprofitable", "demand_uncertainty", "backlog_instability"],
      related_causes: ["poor_bid_selection", "weak_sales_qualification"],
      expected_impact: "Cleaner growth choices and healthier delivery mix",
      difficulty_level: "medium",
      time_horizon: "2-6 weeks"
    }
  ];

  const BENCHMARK_REVENUE_BANDS = [
    "under_500k",
    "500k_1m",
    "1m_3m",
    "3m_10m",
    "10m_25m",
    "25m_plus",
    "unknown"
  ];

  const BENCHMARK_TEAM_BANDS = [
    "solo",
    "team_2_5",
    "team_6_15",
    "team_16_50",
    "team_51_plus",
    "unknown"
  ];

  const BENCHMARK_MARKET_SCOPES = [
    "local",
    "multi_county",
    "regional",
    "national",
    "mixed",
    "unknown"
  ];

  const NORMALIZED_MAJOR_FIELDS = [
    "business_type_slug",
    "business_model_slugs",
    "symptom_tag_slugs",
    "cause_tag_slugs",
    "recommendation_keys",
    "operating_archetype_slug"
  ];

  const BUSINESS_TYPES_BY_SLUG = mapBySlug(BUSINESS_TYPES);
  const BUSINESS_MODELS_BY_SLUG = mapBySlug(BUSINESS_MODELS);
  const SYMPTOMS_BY_SLUG = mapBySlug(SYMPTOM_TAGS);
  const CAUSES_BY_SLUG = mapBySlug(CAUSE_TAGS);
  const ARCHETYPES_BY_SLUG = mapBySlug(OPERATING_ARCHETYPES);
  const RECOMMENDATIONS_BY_ID = RECOMMENDATION_LIBRARY.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  function mapBySlug(items) {
    return items.reduce((acc, item) => {
      acc[item.slug] = item;
      return acc;
    }, {});
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toArray(value) {
    if (Array.isArray(value)) return value;
    if (value == null || value === "") return [];
    return [value];
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9/&+\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function slugify(value) {
    return normalizeText(value)
      .replace(/[\/&+]/g, " ")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  }

  function prettyLabel(value) {
    return String(value || "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function uniqueList(values) {
    const seen = new Set();
    return values.filter((value) => {
      if (value == null || value === "") return false;
      const key = typeof value === "string" ? value : JSON.stringify(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function collectStrings(value, bucket) {
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
      Object.values(value).forEach((item) => collectStrings(item, bucket));
    }
    return bucket;
  }

  function extractCandidateStrings(sources) {
    const bucket = [];
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

  function asStringArray(value) {
    return extractCandidateStrings([value]);
  }

  function resolveExactSlugFromCandidates(items, sources) {
    const candidates = extractCandidateStrings(sources);
    for (const candidate of candidates) {
      const match = resolveExactMatch(items, [candidate]);
      if (match) return match.slug;
    }
    return null;
  }

  function resolveExactSlugListFromCandidates(items, sources, limit) {
    const candidates = extractCandidateStrings(sources);
    const resolved = [];
    candidates.forEach((candidate) => {
      const match = resolveExactMatch(items, [candidate]);
      if (match) resolved.push(match.slug);
    });
    return uniqueList(resolved).slice(0, limit);
  }

  function resolveExactRecommendationKeys(sources, limit) {
    const candidates = extractCandidateStrings(sources);
    const resolved = [];
    candidates.forEach((candidate) => {
      const normalizedCandidate = normalizeText(candidate);
      RECOMMENDATION_LIBRARY.forEach((item) => {
        const names = [item.id, item.slug, item.title];
        if (names.some((name) => normalizeText(name) === normalizedCandidate || normalizedCandidate.includes(normalizeText(name)))) {
          resolved.push(item.id);
        }
      });
    });
    return uniqueList(resolved).slice(0, limit);
  }

  function normalizeAllowedSlug(sources, allowedValues) {
    const candidates = extractCandidateStrings(sources);
    for (const candidate of candidates) {
      const slug = slugify(candidate);
      if (allowedValues.includes(slug)) return slug;
    }
    return null;
  }

  function normalizePrimaryBusinessTypeSlug(sources) {
    const resolved = resolveExactSlugFromCandidates(BUSINESS_TYPES, sources);
    if (!resolved) return null;
    const item = BUSINESS_TYPES_BY_SLUG[resolved];
    if (item && item.level === "secondary") return item.parent || resolved;
    return resolved;
  }

  function normalizeExactConfidence(sources) {
    const candidates = extractCandidateStrings(sources);
    for (const candidate of candidates) {
      const numeric = Number(candidate);
      if (Number.isFinite(numeric)) return clamp(numeric, 0, 1);
    }
    return null;
  }

  function labelForTaxonomy(slug, map) {
    if (!slug) return null;
    if (map[slug]) return map[slug].label;
    if (RECOMMENDATIONS_BY_ID[slug]) return RECOMMENDATIONS_BY_ID[slug].title;
    return prettyLabel(slug);
  }

  function resolveExactMatch(items, candidates) {
    for (const candidate of candidates) {
      const normalizedCandidate = normalizeText(candidate);
      if (!normalizedCandidate) continue;
      for (const item of items) {
        const names = uniqueList([item.slug, item.label].concat(item.keywords || []).concat(item.synonyms || []));
        const matched = names.some((name) => normalizeText(name) === normalizedCandidate || normalizedCandidate.includes(normalizeText(name)));
        if (matched) return { slug: item.slug, method: "explicit", score: 1 };
      }
    }
    return null;
  }

  function scoreMatch(item, corpus) {
    let score = 0;
    const names = uniqueList([item.label].concat(item.keywords || []).concat(item.synonyms || []));
    names.forEach((name) => {
      const normalizedName = normalizeText(name);
      if (!normalizedName) return;
      if (corpus.includes(normalizedName)) {
        score += normalizedName.split(" ").length > 1 ? 4 : 2;
      }
    });
    const slugParts = String(item.slug || "").split("_").join(" ");
    if (slugParts && corpus.includes(slugParts)) score += 2;
    return score;
  }

  function resolveBestMatch(items, candidates, corpus) {
    const explicit = resolveExactMatch(items, candidates);
    if (explicit) return explicit;

    let best = null;
    items.forEach((item) => {
      const score = scoreMatch(item, corpus);
      if (!best || score > best.score) {
        best = { slug: item.slug, method: "heuristic", score };
      }
    });
    return best && best.score > 0 ? best : null;
  }

  function resolveMultipleMatches(items, candidates, corpus, limit) {
    const resolved = [];
    candidates.forEach((candidate) => {
      const match = resolveExactMatch(items, [candidate]);
      if (match) resolved.push(match.slug);
    });

    const scored = items
      .map((item) => ({ slug: item.slug, score: scoreMatch(item, corpus) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.slug);

    return uniqueList(resolved.concat(scored)).slice(0, limit);
  }

  function defaultBusinessModels(primaryBusinessType) {
    switch (primaryBusinessType) {
      case "trucking_logistics":
        return ["route_heavy", "labor_heavy"];
      case "commercial_cleaning":
      case "landscaping":
      case "hvac":
        return ["field_service", "office_and_field", "labor_heavy"];
      case "steel_fabrication":
      case "manufacturing":
        return ["production_based", "labor_heavy"];
      case "distribution":
        return ["inventory_heavy", "transactional"];
      case "agency_consulting":
      case "professional_service":
        return ["owner_led", "project_based"];
      case "general_contractor":
      case "trade_contractor":
        return ["project_based", "quote_heavy", "labor_heavy"];
      default:
        return [];
    }
  }

  function normalizeBusinessTypes(extracted, findings, corpus) {
    const primaryCandidates = extractCandidateStrings([
      extracted.primary_business_type,
      extracted.business_type,
      extracted.industry,
      findings && findings.primary_business_type,
      findings && findings.business_type
    ]);
    const secondaryCandidates = extractCandidateStrings([
      extracted.secondary_business_type,
      extracted.sub_industry,
      extracted.subindustry,
      findings && findings.secondary_business_type,
      findings && findings.sub_industry
    ]);

    let primaryMatch = resolveBestMatch(BUSINESS_TYPES, primaryCandidates, corpus);
    let secondaryMatch = resolveBestMatch(BUSINESS_TYPES, secondaryCandidates, corpus);

    if (!secondaryMatch && primaryMatch && BUSINESS_TYPES_BY_SLUG[primaryMatch.slug] && BUSINESS_TYPES_BY_SLUG[primaryMatch.slug].level !== "primary") {
      secondaryMatch = primaryMatch;
    }

    let primary = primaryMatch ? primaryMatch.slug : null;
    let secondary = secondaryMatch ? secondaryMatch.slug : null;

    if (secondary && BUSINESS_TYPES_BY_SLUG[secondary] && BUSINESS_TYPES_BY_SLUG[secondary].parent) {
      primary = BUSINESS_TYPES_BY_SLUG[secondary].parent;
    }

    if (primary && BUSINESS_TYPES_BY_SLUG[primary] && BUSINESS_TYPES_BY_SLUG[primary].level !== "primary") {
      primary = BUSINESS_TYPES_BY_SLUG[primary].parent || primary;
    }

    if (!primary) primary = "other";

    const subIndustry = secondary && BUSINESS_TYPES_BY_SLUG[secondary] && BUSINESS_TYPES_BY_SLUG[secondary].level === "secondary"
      ? secondary
      : null;

    const confidence = secondaryMatch
      ? 0.88
      : primaryMatch
        ? primaryMatch.method === "explicit" ? 0.82 : 0.66
        : 0.34;

    return {
      primary,
      secondary: secondary && secondary !== primary ? secondary : null,
      subIndustry,
      confidence
    };
  }

  function normalizeBusinessModels(primaryBusinessType, extracted, findings, corpus) {
    const modelCandidates = extractCandidateStrings([
      extracted.business_model,
      extracted.business_models,
      extracted.business_model_tags,
      findings && findings.business_model,
      findings && findings.business_models
    ]);
    const matches = resolveMultipleMatches(BUSINESS_MODELS, modelCandidates, corpus, 5);
    const combined = uniqueList(matches.concat(defaultBusinessModels(primaryBusinessType)));
    return {
      primary: combined[0] || null,
      tags: combined
    };
  }

  function normalizeSizeBand(extracted, corpus) {
    const explicit = extractCandidateStrings([extracted.size_band, extracted.company_size, extracted.team_size, extracted.employee_band])[0];
    const explicitSlug = slugify(explicit);
    if (explicitSlug) return explicitSlug;

    const numberMatch = corpus.match(/\b(\d{1,3})\s+(employees|people|staff|techs|technicians|crew|workers)\b/);
    if (numberMatch) {
      const count = Number(numberMatch[1]);
      if (count <= 2) return "solo_or_owner_led";
      if (count <= 5) return "small_team_2_5";
      if (count <= 15) return "growing_team_6_15";
      if (count <= 50) return "scaled_team_16_50";
      return "larger_team_51_plus";
    }

    if (corpus.includes("myself and")) return "small_team_2_5";
    if (corpus.includes("small team")) return "small_team_2_5";
    return null;
  }

  function normalizeTeamStructure(extracted, modelTags, primaryBusinessType, corpus) {
    const explicit = extractCandidateStrings([extracted.team_structure])[0];
    if (explicit) return slugify(explicit);
    if (modelTags.includes("owner_led") && modelTags.includes("field_service")) return "owner_led_field_team";
    if (modelTags.includes("office_and_field")) return "office_and_field_team";
    if (primaryBusinessType === "manufacturing" || primaryBusinessType === "steel_fabrication") return "production_floor_team";
    if (corpus.includes("office staff")) return "office_led_team";
    return modelTags.includes("owner_led") ? "owner_led_team" : null;
  }

  function normalizeOperationalComplexity(modelTags, sizeBand, symptomTags) {
    let score = modelTags.length;
    if (sizeBand === "scaled_team_16_50" || sizeBand === "larger_team_51_plus") score += 2;
    if (sizeBand === "growing_team_6_15") score += 1;
    if (symptomTags.includes("scheduling_chaos")) score += 1;
    if (symptomTags.includes("weak_handoff")) score += 1;
    if (score >= 6) return "high";
    if (score >= 3) return "medium";
    return "low";
  }

  function normalizeTagList(items, explicitSources, corpus, limit) {
    const candidates = extractCandidateStrings(explicitSources);
    return resolveMultipleMatches(items, candidates, corpus, limit);
  }

  function normalizeProblemSlug(extracted, findings, fallbackTags) {
    const explicit = extractCandidateStrings([
      findings && findings.main_issue,
      findings && findings.priority,
      extracted.main_problem,
      extracted.secondary_problem
    ])[0];
    if (explicit) return slugify(explicit);
    return fallbackTags[0] || null;
  }

  function normalizeSecondaryProblemSlug(extracted, findings, fallbackTags) {
    const explicit = extractCandidateStrings([
      findings && findings.secondary_issue,
      extracted.secondary_problem
    ])[0];
    if (explicit) return slugify(explicit);
    return fallbackTags[1] || null;
  }

  function normalizeUrgencyLevel(symptomTags, contextScore, findingsReady) {
    if (symptomTags.includes("cash_flow_pressure") || symptomTags.includes("busy_but_unprofitable")) return "high";
    if (findingsReady && contextScore >= 80) return "high";
    if (contextScore >= 55 || symptomTags.length >= 2) return "medium";
    return "low";
  }

  function normalizeClarityLevel(contextScore, findingsReady) {
    if (findingsReady || contextScore >= 82) return "high";
    if (contextScore >= 50) return "medium";
    return "low";
  }

  function deriveOperatingArchetype(symptomTags, causeTags, contextScore) {
    if (symptomTags.includes("owner_bottleneck") || causeTags.includes("owner_centralized_decisions")) return "growing_but_owner_locked";
    if (symptomTags.includes("underpriced_work") || causeTags.includes("pricing_visibility_gap")) return "selling_but_underpricing";
    if (symptomTags.includes("scheduling_chaos") || symptomTags.includes("weak_handoff") || causeTags.includes("reactive_firefighting")) return "chaotic_execution";
    if (symptomTags.includes("capacity_constraint")) return "demand_rich_capacity_constrained";
    if (symptomTags.includes("low_visibility") || symptomTags.includes("no_kpi_discipline")) return contextScore >= 65 ? "kpi_weak_but_stable" : "busy_but_blind";
    if (symptomTags.includes("busy_but_unprofitable")) return "busy_but_blind";
    if (symptomTags.includes("sales_pipeline_gap") || symptomTags.includes("backlog_instability")) return "profitable_core_weak_growth_engine";
    return null;
  }

  function coerceSignalMap(value) {
    const signals = {};

    if (Array.isArray(value)) {
      value.forEach((item) => {
        const key = slugify(item);
        if (key) signals[key] = true;
      });
      return signals;
    }

    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, signalValue]) => {
        const normalizedKey = slugify(key);
        if (!normalizedKey) return;
        if (typeof signalValue === "boolean") {
          if (signalValue) signals[normalizedKey] = true;
          return;
        }
        if (typeof signalValue === "number") {
          if (!Number.isNaN(signalValue) && signalValue > 0) signals[normalizedKey] = signalValue;
          return;
        }
        if (typeof signalValue === "string" && signalValue.trim()) {
          signals[normalizedKey] = signalValue.trim();
        }
      });
      return signals;
    }

    const single = slugify(value);
    if (single) signals[single] = true;
    return signals;
  }

  function hasAgentValue(value) {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.keys(value).length > 0;
    return value != null && value !== "";
  }

  function mapSizeBandToTeamBand(sizeBand) {
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

  function normalizeRevenueBand(extracted, corpus) {
    const explicit = extractCandidateStrings([
      extracted.benchmark_revenue_band,
      extracted.revenue_band,
      extracted.annual_revenue,
      extracted.revenue
    ])[0];
    const explicitSlug = slugify(explicit);
    if (BENCHMARK_REVENUE_BANDS.includes(explicitSlug)) return explicitSlug;

    const match = corpus.match(/\b(\d+(?:\.\d+)?)\s*(m|mm|million|k|thousand)\b/);
    if (!match) return null;

    const amount = Number(match[1]);
    if (!Number.isFinite(amount)) return null;

    const normalized = match[2].startsWith("k") || match[2].startsWith("thousand")
      ? amount / 1000
      : amount;

    if (normalized < 0.5) return "under_500k";
    if (normalized < 1) return "500k_1m";
    if (normalized < 3) return "1m_3m";
    if (normalized < 10) return "3m_10m";
    if (normalized < 25) return "10m_25m";
    return "25m_plus";
  }

  function normalizeTeamBand(extracted, sizeBand) {
    const explicit = extractCandidateStrings([extracted.benchmark_team_band, extracted.team_band])[0];
    const explicitSlug = slugify(explicit);
    if (BENCHMARK_TEAM_BANDS.includes(explicitSlug)) return explicitSlug;
    return mapSizeBandToTeamBand(sizeBand);
  }

  function normalizeMarketScope(extracted, corpus) {
    const explicit = extractCandidateStrings([
      extracted.benchmark_market_scope,
      extracted.market_scope,
      extracted.service_area
    ])[0];
    const explicitSlug = slugify(explicit);
    if (BENCHMARK_MARKET_SCOPES.includes(explicitSlug)) return explicitSlug;

    if (/national|nationwide|across the country/.test(corpus)) return "national";
    if (/regional|multi[-\s]?state|several states/.test(corpus)) return "regional";
    if (/multi[-\s]?county|several counties/.test(corpus)) return "multi_county";
    if (/local|single county|single city|within.*county/.test(corpus)) return "local";
    return null;
  }

  function buildClientSignalMap(primaryBusinessType, businessModelSlugs, symptomTags, causeTags, findingsReady, contextScore) {
    return {
      agent_normalized: false,
      business_type_identified: Boolean(primaryBusinessType),
      findings_ready: Boolean(findingsReady),
      field_service_pattern: businessModelSlugs.includes("field_service"),
      route_pattern: businessModelSlugs.includes("route_heavy"),
      recurring_revenue_pattern: businessModelSlugs.includes("recurring_revenue"),
      owner_dependence: symptomTags.includes("owner_bottleneck") || causeTags.includes("owner_centralized_decisions"),
      margin_pressure: symptomTags.includes("busy_but_unprofitable") || symptomTags.includes("underpriced_work") || causeTags.includes("pricing_visibility_gap"),
      visibility_gap: symptomTags.includes("low_visibility") || causeTags.includes("weak_metric_discipline"),
      schedule_pressure: symptomTags.includes("scheduling_chaos") || symptomTags.includes("dispatch_noise") || causeTags.includes("no_capacity_planning"),
      context_confident: contextScore >= 62
    };
  }

  function extractAgentNormalized(input, extracted, findings) {
    const state = input.state || {};
    const responseNormalized = input.response && typeof input.response === "object" ? input.response.normalized : null;
    const mirroredExtracted = {
      business_type_slug: extracted.primary_business_type || extracted.business_type,
      business_model_slugs: extracted.business_model_tags || extracted.business_models || extracted.business_model,
      symptom_tag_slugs: extracted.symptom_tags,
      cause_tag_slugs: extracted.cause_tags || extracted.inferred_causes,
      recommendation_keys: extracted.recommendation_keys || extracted.recommendation_ids,
      operating_archetype_slug: extracted.operating_archetype,
      confidence: extracted.confidence,
      benchmark_size_band: extracted.benchmark_size_band || extracted.size_band,
      benchmark_revenue_band: extracted.benchmark_revenue_band,
      benchmark_team_band: extracted.benchmark_team_band,
      benchmark_market_scope: extracted.benchmark_market_scope,
      signals: extracted.signals
    };
    const mirroredFindings = findings && typeof findings === "object"
      ? {
          business_type_slug: findings.business_type,
          symptom_tag_slugs: findings.symptom_tags,
          cause_tag_slugs: findings.cause_tags,
          recommendation_keys: findings.recommendation_keys || findings.recommendation_ids,
          operating_archetype_slug: findings.operating_archetype
        }
      : null;

    const candidates = [
      responseNormalized,
      state.latestAgentNormalized,
      state.agentNormalized,
      extracted.normalized,
      mirroredExtracted,
      mirroredFindings
    ].filter(Boolean);

    const mergedSignals = candidates.reduce((acc, candidate) => ({
      ...acc,
      ...coerceSignalMap(candidate.signals)
    }), {});

    return {
      business_type_slug: normalizePrimaryBusinessTypeSlug(candidates.map((candidate) => candidate.business_type_slug)),
      business_model_slugs: uniqueList(candidates.flatMap((candidate) => resolveExactSlugListFromCandidates(BUSINESS_MODELS, [candidate.business_model_slugs], 5))).slice(0, 5),
      symptom_tag_slugs: uniqueList(candidates.flatMap((candidate) => resolveExactSlugListFromCandidates(SYMPTOM_TAGS, [candidate.symptom_tag_slugs], 6))).slice(0, 6),
      cause_tag_slugs: uniqueList(candidates.flatMap((candidate) => resolveExactSlugListFromCandidates(CAUSE_TAGS, [candidate.cause_tag_slugs], 6))).slice(0, 6),
      recommendation_keys: uniqueList(candidates.flatMap((candidate) => resolveExactRecommendationKeys([candidate.recommendation_keys], 4))).slice(0, 4),
      operating_archetype_slug: resolveExactSlugFromCandidates(OPERATING_ARCHETYPES, candidates.map((candidate) => candidate.operating_archetype_slug)),
      confidence: normalizeExactConfidence(candidates.map((candidate) => candidate.confidence)),
      benchmark_size_band: normalizeAllowedSlug(candidates.map((candidate) => candidate.benchmark_size_band), [
        "solo_or_owner_led",
        "small_team_2_5",
        "growing_team_6_15",
        "scaled_team_16_50",
        "larger_team_51_plus"
      ]),
      benchmark_revenue_band: normalizeAllowedSlug(candidates.map((candidate) => candidate.benchmark_revenue_band), BENCHMARK_REVENUE_BANDS),
      benchmark_team_band: normalizeAllowedSlug(candidates.map((candidate) => candidate.benchmark_team_band), BENCHMARK_TEAM_BANDS),
      benchmark_market_scope: normalizeAllowedSlug(candidates.map((candidate) => candidate.benchmark_market_scope), BENCHMARK_MARKET_SCOPES),
      signals: mergedSignals
    };
  }

  function resolveRecommendationIds(primaryBusinessType, symptomTags, causeTags, extracted, findings, corpus) {
    const recommendationCandidates = extractCandidateStrings([
      extracted.recommendation_ids,
      extracted.recommendations,
      findings && findings.recommendation_ids,
      findings && findings.recommendations,
      findings && findings.first_moves,
      findings && findings.next_step
    ]);

    const explicit = [];
    recommendationCandidates.forEach((candidate) => {
      const normalizedCandidate = normalizeText(candidate);
      RECOMMENDATION_LIBRARY.forEach((item) => {
        const names = [item.id, item.slug, item.title];
        if (names.some((name) => normalizeText(name) === normalizedCandidate || normalizedCandidate.includes(normalizeText(name)))) {
          explicit.push(item.id);
        }
      });
    });

    const scored = RECOMMENDATION_LIBRARY
      .map((item) => {
        let score = 0;
        if (item.applies_to_business_types.includes(primaryBusinessType)) score += 2;
        score += item.addresses_symptoms.filter((slug) => symptomTags.includes(slug)).length * 3;
        score += item.related_causes.filter((slug) => causeTags.includes(slug)).length * 3;
        if (scoreMatch({ slug: item.slug, label: item.title, keywords: [item.description] }, corpus) > 0) score += 1;
        return { id: item.id, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.id);

    return uniqueList(explicit.concat(scored)).slice(0, 4);
  }

  function buildRecommendationPayload(recommendationIds, findings) {
    const freeText = extractCandidateStrings([
      findings && findings.recommendations,
      findings && findings.first_moves,
      findings && findings.next_step
    ]).slice(0, 6);

    return {
      ids: recommendationIds,
      library_entries: recommendationIds.map((id) => RECOMMENDATIONS_BY_ID[id]).filter(Boolean),
      free_text: freeText
    };
  }

  function deriveConfidenceValue(state, businessTypeConfidence, contextScore, findingsReady) {
    if (typeof state.extractionConfidence === "number" && !Number.isNaN(state.extractionConfidence)) {
      return clamp(state.extractionConfidence, 0.2, 0.99);
    }

    let value = 0.28 + businessTypeConfidence * 0.25 + clamp(contextScore / 100, 0, 1) * 0.37;
    if (findingsReady) value += 0.1;
    if (state.extracted && Object.keys(state.extracted).length >= 5) value += 0.05;
    return clamp(Number(value.toFixed(2)), 0.2, 0.99);
  }

  function deriveBuySignal(state) {
    let score = 20;
    if (state.ctaReady) score += 30;
    if (state.contactOpen) score += 15;
    if (state.freeFollowupsUsed >= 2) score += 10;
    if (state.findings) score += 15;
    if (state.contactSubmitted) score += 20;
    const bounded = clamp(score, 5, 100);
    return {
      score: bounded,
      label: bounded >= 75 ? "high" : bounded >= 45 ? "medium" : "low"
    };
  }

  function deriveSourceDetails(pageUrl) {
    const details = {
      source: "web",
      channel: null
    };

    try {
      const url = new URL(pageUrl);
      details.source = url.searchParams.get("utm_source") || url.searchParams.get("source") || "web";
      details.channel = url.searchParams.get("utm_medium") || url.searchParams.get("channel") || null;
    } catch (error) {
      details.source = "web";
    }

    return details;
  }

  function extractQuestions(conversation) {
    const questions = [];
    conversation
      .filter((entry) => entry.role === "assistant")
      .forEach((entry, index) => {
        const content = String(entry.content || "");
        const matches = content.match(/[^?]+\?/g) || [];
        matches.forEach((text) => {
          const cleaned = text.replace(/\s+/g, " ").trim();
          if (!cleaned) return;
          questions.push({
            turn: index + 1,
            question: cleaned
          });
        });
      });
    return questions.slice(-20);
  }

  function extractStageHistory(state) {
    const history = Array.isArray(state.stageHistory) ? state.stageHistory : [];
    const current = state.stage || "discover";
    return uniqueList(history.concat(current)).filter(Boolean);
  }

  function buildBranchPath(primaryBusinessType, primaryProblem, operatingArchetype) {
    return uniqueList([primaryBusinessType, primaryProblem, operatingArchetype]);
  }

  function buildSessionRecord(input) {
    const state = input.state || {};
    const extracted = state.extracted && typeof state.extracted === "object" ? state.extracted : {};
    const findings = state.findings && typeof state.findings === "object" ? state.findings : state.findings || null;
    const findingsObject = findings && typeof findings === "object" ? findings : {};
    const conversation = Array.isArray(state.conversation)
      ? state.conversation.filter((entry) => entry && entry.role !== "system")
      : [];
    const corpus = normalizeText(collectStrings([extracted, findings, conversation], []).join(" "));

    const businessTypes = normalizeBusinessTypes(extracted, findingsObject, corpus);
    const clientBusinessModels = normalizeBusinessModels(businessTypes.primary, extracted, findingsObject, corpus);
    const clientSymptomTags = normalizeTagList(
      SYMPTOM_TAGS,
      [extracted.symptom_tags, extracted.symptoms, extracted.pain_points, findingsObject.symptom_tags, findingsObject.what_is_hurting],
      corpus,
      6
    );
    const clientCauseTags = normalizeTagList(
      CAUSE_TAGS,
      [extracted.cause_tags, extracted.inferred_causes, findingsObject.cause_tags, findingsObject.what_this_likely_means],
      corpus,
      6
    );
    const clientRecommendationIds = resolveRecommendationIds(
      businessTypes.primary,
      clientSymptomTags,
      clientCauseTags,
      extracted,
      findingsObject,
      corpus
    );
    const stageHistory = extractStageHistory(state);
    const sourceDetails = deriveSourceDetails(input.pageUrl || window.location.href);
    const findingsReady = Boolean(state.findings);
    const clientSizeBand = normalizeSizeBand(extracted, corpus);
    const clientOperatingArchetype = deriveOperatingArchetype(clientSymptomTags, clientCauseTags, Number(input.contextScore || 0));
    const clientConfidence = deriveConfidenceValue(state, businessTypes.confidence, Number(input.contextScore || 0), findingsReady);
    const clientFallback = {
      business_type_slug: businessTypes.primary,
      business_model_slugs: clientBusinessModels.tags,
      symptom_tag_slugs: clientSymptomTags,
      cause_tag_slugs: clientCauseTags,
      recommendation_keys: clientRecommendationIds,
      operating_archetype_slug: clientOperatingArchetype,
      confidence: clientConfidence,
      benchmark_size_band: clientSizeBand,
      benchmark_revenue_band: normalizeRevenueBand(extracted, corpus),
      benchmark_team_band: normalizeTeamBand(extracted, clientSizeBand),
      benchmark_market_scope: normalizeMarketScope(extracted, corpus),
      signals: buildClientSignalMap(
        businessTypes.primary,
        clientBusinessModels.tags,
        clientSymptomTags,
        clientCauseTags,
        findingsReady,
        Number(input.contextScore || 0)
      )
    };
    const agentNormalized = extractAgentNormalized(input, extracted, findingsObject);
    const mergedNormalized = {
      business_type_slug: agentNormalized.business_type_slug || clientFallback.business_type_slug || null,
      business_model_slugs: uniqueList(
        (
          agentNormalized.business_model_slugs && agentNormalized.business_model_slugs.length
            ? agentNormalized.business_model_slugs
            : clientFallback.business_model_slugs
        ) || []
      ).slice(0, 5),
      symptom_tag_slugs: uniqueList(
        (
          agentNormalized.symptom_tag_slugs && agentNormalized.symptom_tag_slugs.length
            ? agentNormalized.symptom_tag_slugs
            : clientFallback.symptom_tag_slugs
        ) || []
      ).slice(0, 6),
      cause_tag_slugs: uniqueList(
        (
          agentNormalized.cause_tag_slugs && agentNormalized.cause_tag_slugs.length
            ? agentNormalized.cause_tag_slugs
            : clientFallback.cause_tag_slugs
        ) || []
      ).slice(0, 6),
      recommendation_keys: uniqueList(
        (
          agentNormalized.recommendation_keys && agentNormalized.recommendation_keys.length
            ? agentNormalized.recommendation_keys
            : clientFallback.recommendation_keys
        ) || []
      ).slice(0, 4),
      operating_archetype_slug: agentNormalized.operating_archetype_slug || clientFallback.operating_archetype_slug || null,
      confidence: typeof agentNormalized.confidence === "number"
        ? agentNormalized.confidence
        : clientFallback.confidence ?? null,
      benchmark_size_band: agentNormalized.benchmark_size_band || clientFallback.benchmark_size_band || null,
      benchmark_revenue_band: agentNormalized.benchmark_revenue_band || clientFallback.benchmark_revenue_band || null,
      benchmark_team_band: agentNormalized.benchmark_team_band || clientFallback.benchmark_team_band || null,
      benchmark_market_scope: agentNormalized.benchmark_market_scope || clientFallback.benchmark_market_scope || null,
      signals: {
        ...(clientFallback.signals || {}),
        ...(agentNormalized.signals || {})
      }
    };
    const normalizationFieldSources = {
      business_type_slug: hasAgentValue(agentNormalized.business_type_slug) ? "agent" : hasAgentValue(clientFallback.business_type_slug) ? "client" : "missing",
      business_model_slugs: hasAgentValue(agentNormalized.business_model_slugs) ? "agent" : hasAgentValue(clientFallback.business_model_slugs) ? "client" : "missing",
      symptom_tag_slugs: hasAgentValue(agentNormalized.symptom_tag_slugs) ? "agent" : hasAgentValue(clientFallback.symptom_tag_slugs) ? "client" : "missing",
      cause_tag_slugs: hasAgentValue(agentNormalized.cause_tag_slugs) ? "agent" : hasAgentValue(clientFallback.cause_tag_slugs) ? "client" : "missing",
      recommendation_keys: hasAgentValue(agentNormalized.recommendation_keys) ? "agent" : hasAgentValue(clientFallback.recommendation_keys) ? "client" : "missing",
      operating_archetype_slug: hasAgentValue(agentNormalized.operating_archetype_slug) ? "agent" : hasAgentValue(clientFallback.operating_archetype_slug) ? "client" : "missing"
    };
    const agentMajorCount = Object.values(normalizationFieldSources).filter((value) => value === "agent").length;
    const normalizationSource = agentMajorCount === NORMALIZED_MAJOR_FIELDS.length
      ? "agent"
      : agentMajorCount === 0
        ? "client"
        : "mixed";
    const agentNormalizedFlag = agentMajorCount > 0;
    mergedNormalized.signals = {
      ...mergedNormalized.signals,
      agent_normalized: agentNormalizedFlag,
      normalization_source: normalizationSource
    };
    const recommendations = buildRecommendationPayload(mergedNormalized.recommendation_keys, findingsObject);
    const sizeBand = mergedNormalized.benchmark_size_band;
    const businessModel = mergedNormalized.business_model_slugs[0] || null;
    const teamStructure = normalizeTeamStructure(extracted, mergedNormalized.business_model_slugs, mergedNormalized.business_type_slug, corpus);
    const primaryProblem = normalizeProblemSlug(extracted, findingsObject, mergedNormalized.cause_tag_slugs.concat(mergedNormalized.symptom_tag_slugs));
    const secondaryProblem = normalizeSecondaryProblemSlug(extracted, findingsObject, mergedNormalized.cause_tag_slugs.concat(mergedNormalized.symptom_tag_slugs));
    const operatingArchetype = mergedNormalized.operating_archetype_slug;
    const operationalComplexity = normalizeOperationalComplexity(mergedNormalized.business_model_slugs, sizeBand, mergedNormalized.symptom_tag_slugs);
    const confidenceValue = typeof mergedNormalized.confidence === "number"
      ? clamp(Number(mergedNormalized.confidence.toFixed(2)), 0.2, 0.99)
      : clientConfidence;
    const confidenceLabel = input.confidenceLabel || (confidenceValue >= 0.8 ? "High" : confidenceValue >= 0.55 ? "Medium" : "Low");
    const buySignal = deriveBuySignal(state);
    const completionStatus = state.contactSubmitted
      ? "contact_submitted"
      : findingsReady
        ? "completed"
        : state.started
          ? "in_progress"
          : "in_progress";
    const completedAt = completionStatus === "completed" || completionStatus === "contact_submitted"
      ? state.completedAt || new Date().toISOString()
      : null;
    const benchmarkSegment = uniqueList([mergedNormalized.business_type_slug, sizeBand, businessModel]).join("__");
    const questionSequence = extractQuestions(conversation);

    const rawSession = {
      session_id: state.sessionId || null,
      created_at: state.sessionCreatedAt || new Date().toISOString(),
      completed_at: completedAt,
      completion_status: completionStatus,
      transcript: conversation,
      extracted_json: extracted,
      findings_json: findings,
      recommendations_json: recommendations,
      score: typeof input.assessmentScore === "number" ? input.assessmentScore : null,
      readiness_score: Number(input.contextScore || 0),
      confidence: confidenceValue,
      confidence_label: confidenceLabel,
      buy_signal: buySignal.label,
      buy_signal_score: buySignal.score,
      contact_submitted: Boolean(state.contactSubmitted),
      source: sourceDetails.source,
      channel: sourceDetails.channel,
      page_url: input.pageUrl || window.location.href,
      build_version: input.buildVersion || null,
      session_path: stageHistory,
      branch_path: buildBranchPath(mergedNormalized.business_type_slug, primaryProblem, operatingArchetype)
    };

    const normalizedFeatures = {
      primary_business_type: mergedNormalized.business_type_slug,
      secondary_business_type: businessTypes.secondary,
      sub_industry: businessTypes.subIndustry,
      business_model: businessModel,
      business_model_tags: mergedNormalized.business_model_slugs,
      size_band: sizeBand,
      benchmark_revenue_band: mergedNormalized.benchmark_revenue_band,
      benchmark_team_band: mergedNormalized.benchmark_team_band,
      benchmark_market_scope: mergedNormalized.benchmark_market_scope,
      team_structure: teamStructure,
      operational_complexity: operationalComplexity,
      primary_problem: primaryProblem,
      secondary_problem: secondaryProblem,
      symptom_tags: mergedNormalized.symptom_tag_slugs,
      inferred_cause_tags: mergedNormalized.cause_tag_slugs,
      recommendation_ids: mergedNormalized.recommendation_keys,
      urgency_level: normalizeUrgencyLevel(mergedNormalized.symptom_tag_slugs, Number(input.contextScore || 0), findingsReady),
      clarity_level: normalizeClarityLevel(Number(input.contextScore || 0), findingsReady),
      operating_archetype: operatingArchetype,
      benchmark_segment: benchmarkSegment || null,
      benchmark_ready: Boolean(mergedNormalized.business_type_slug && input.assessmentScore != null),
      classification_confidence: typeof mergedNormalized.confidence === "number"
        ? Number(mergedNormalized.confidence.toFixed(2))
        : Number(businessTypes.confidence.toFixed(2)),
      signals: mergedNormalized.signals,
      normalization_source: normalizationSource,
      agent_normalized: agentNormalizedFlag,
      normalization_field_sources: normalizationFieldSources
    };

    const productLearning = {
      session_path: stageHistory,
      branch_path: rawSession.branch_path,
      completion_status: completionStatus,
      drop_off_step: completionStatus === "in_progress" ? state.stage || "discover" : null,
      last_completed_step: findingsReady ? "findings" : state.stage || "discover",
      low_confidence: confidenceValue < 0.55,
      extraction_confidence: confidenceValue,
      stages_seen: stageHistory,
      questions_appeared: questionSequence,
      recommendation_frequency: mergedNormalized.recommendation_keys.length,
      usefulness_feedback: state.usefulnessFeedback || null,
      normalization_source: normalizationSource,
      agent_normalized: agentNormalizedFlag
    };
    const pendingNotificationEvents = Array.isArray(state.pendingNotificationEvents)
      ? state.pendingNotificationEvents
      : [];

    return {
      schema_version: SCHEMA_VERSION,
      captured_at: new Date().toISOString(),
      raw_session: rawSession,
      normalized_features: normalizedFeatures,
      product_learning: productLearning,
      contact_details: state.contactDetails && typeof state.contactDetails === "object"
        ? state.contactDetails
        : null,
      pending_notification_events: pendingNotificationEvents,
      normalization_source: normalizationSource,
      agent_normalized: agentNormalizedFlag,
      agent_normalized_payload: agentNormalized,
      client_normalized_fallback: clientFallback,
      merged_normalized: mergedNormalized,
      taxonomy: {
        schema_version: SCHEMA_VERSION,
        business_types: BUSINESS_TYPES,
        business_models: BUSINESS_MODELS,
        symptom_tags: SYMPTOM_TAGS,
        cause_tags: CAUSE_TAGS,
        operating_archetypes: OPERATING_ARCHETYPES,
        recommendation_library: RECOMMENDATION_LIBRARY
      },
      display: {
        business_type: labelForTaxonomy(normalizedFeatures.primary_business_type, BUSINESS_TYPES_BY_SLUG),
        secondary_business_type: labelForTaxonomy(normalizedFeatures.secondary_business_type, BUSINESS_TYPES_BY_SLUG),
        business_model: labelForTaxonomy(normalizedFeatures.business_model, BUSINESS_MODELS_BY_SLUG),
        primary_problem: labelForTaxonomy(normalizedFeatures.primary_problem, CAUSES_BY_SLUG) || labelForTaxonomy(normalizedFeatures.primary_problem, SYMPTOMS_BY_SLUG),
        operating_archetype: labelForTaxonomy(normalizedFeatures.operating_archetype, ARCHETYPES_BY_SLUG),
        symptom_labels: normalizedFeatures.symptom_tags.map((slug) => labelForTaxonomy(slug, SYMPTOMS_BY_SLUG)),
        cause_labels: normalizedFeatures.inferred_cause_tags.map((slug) => labelForTaxonomy(slug, CAUSES_BY_SLUG)),
        recommendation_titles: normalizedFeatures.recommendation_ids.map((id) => labelForTaxonomy(id, {}))
      }
    };
  }

  window.OperationalClarityIntelligence = {
    SCHEMA_VERSION,
    TAXONOMY: {
      businessTypes: BUSINESS_TYPES,
      businessModels: BUSINESS_MODELS,
      symptomTags: SYMPTOM_TAGS,
      causeTags: CAUSE_TAGS,
      operatingArchetypes: OPERATING_ARCHETYPES,
      recommendationLibrary: RECOMMENDATION_LIBRARY
    },
    buildSessionRecord,
    prettyLabel
  };
})(window);
