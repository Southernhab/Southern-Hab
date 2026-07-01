-- SHC Landowner Portal — Development Seed Data
-- FICTIONAL DATA ONLY. Do not load this in production.
-- Remove before production launch with: psql -c "SELECT 'Remove seed data manually or restore from backup before going live.'"
-- Tables affected: clients, properties, property_sections, projects, budgets, budget_items.
-- auth.users entries must be created separately via Supabase Auth invite or dashboard.
-- Replace UUIDs here with real auth UUIDs before inserting if testing auth flows.

-- ─────────────────────────────────────────────────────────────────────────────
-- FICTIONAL CLIENT 1 — Pinecrest Farm Holdings
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.clients (id, legal_name, display_name, primary_contact_name, email, phone, city, state, postal_code, status, notes_internal)
VALUES (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'Pinecrest Farm Holdings, LLC',
  'Pinecrest Farm',
  'Thomas Whitfield',
  'thomas.whitfield@example.dev',
  '(251) 555-0101',
  'Brewton',
  'AL',
  '36426',
  'active',
  'Dev seed — fictional. Remove before production.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.properties (id, client_id, name, acreage, county, state, management_summary_client, primary_objectives, status, next_review_date, notes_internal)
VALUES (
  'bbbbbbbb-0001-0001-0001-000000000001',
  'aaaaaaaa-0001-0001-0001-000000000001',
  'Pinecrest Farm',
  612.00,
  'Escambia',
  'AL',
  'Mixed loblolly and longleaf pine with bottomland hardwood. Active prescribed fire and invasive plant control program. Whitetail and turkey management ongoing.',
  'Longleaf pine restoration, whitetail quality management, quail habitat improvement, Chinese tallow control',
  'active',
  '2026-10-15',
  'Dev seed — fictional. Remove before production.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.property_sections (id, property_id, name, acres, habitat_type, current_condition, desired_condition, management_stage, progress_percent, primary_objectives, target_species, limiting_factors, recommended_next_action, planned_season, planned_year, estimated_cost, client_visible_notes, sort_order)
VALUES
(
  'cccccccc-0001-0001-0001-000000000001',
  'bbbbbbbb-0001-0001-0001-000000000001',
  'Section 1 — Upland Pine (Loblolly)',
  220.00,
  'Upland Pine',
  'Mid-rotation loblolly, moderate mid-story encroachment',
  'Open structure with longleaf understory, prescribed fire maintained',
  'Transition',
  45,
  'Longleaf pine conversion, fire reintroduction',
  'Whitetail deer, Wild turkey, Northern bobwhite quail',
  'Mid-story hardwood competition, lack of fire history',
  'Mechanical mid-story treatment, then prescribed underburn',
  'Fall',
  2026,
  8500.00,
  'SHC is developing a fire reintroduction plan for this section. We will present a proposal before fall work begins.',
  1
),
(
  'cccccccc-0001-0001-0001-000000000002',
  'bbbbbbbb-0001-0001-0001-000000000001',
  'Section 2 — Bottomland Hardwood',
  185.00,
  'Bottomland Hardwood',
  'Mixed oak-gum-cypress stand with Chinese tallow pressure along edges',
  'Native hardwood stand maintained, tallow controlled at boundary',
  'Maintenance',
  60,
  'Tallow control, native mast tree retention',
  'Wood duck, Whitetail deer',
  'Chinese tallow invasion, periodic flooding',
  'Follow-up tallow spot treatment — high-priority areas',
  'Summer',
  2026,
  3200.00,
  'Follow-up herbicide treatment planned for the areas treated in 2024. Results from that treatment were good; estimated 78% tallow mortality.',
  2
),
(
  'cccccccc-0001-0001-0001-000000000003',
  'bbbbbbbb-0001-0001-0001-000000000001',
  'Section 3 — Food Plots and Openings',
  42.00,
  'Agricultural / Wildlife Openings',
  'Maintained plots in good condition, some weed pressure in two plots',
  'High-quality wildlife openings with diverse plantings, minimal weed pressure',
  'Maintenance',
  75,
  'Deer and turkey forage, mineral supplementation',
  'Whitetail deer, Wild turkey',
  'Annual weed competition, soil compaction in older plots',
  'Summer weed control application, soil testing',
  'Summer',
  2026,
  1800.00,
  'Three of five plots are producing well. The north plot and creek plot have weed issues that need treatment this summer.',
  3
);

INSERT INTO public.projects (id, property_id, property_section_id, name, work_type, description, priority, classification, status, planned_start_date, planned_end_date, estimated_cost, client_visible, client_notes, client_review_status)
VALUES
(
  'dddddddd-0001-0001-0001-000000000001',
  'bbbbbbbb-0001-0001-0001-000000000001',
  'cccccccc-0001-0001-0001-000000000002',
  'Follow-Up Tallow Spot Treatment — Section 2',
  'Herbicide Treatment',
  'Targeted follow-up herbicide application to Chinese tallow survivors from 2024 treatment. Focus on boundary areas and wet weather drains.',
  'high',
  'Recommended',
  'planned',
  '2026-07-01',
  '2026-08-31',
  3200.00,
  TRUE,
  'This is a follow-up to the 2024 tallow treatment. The initial treatment achieved approximately 78% mortality. Spot treatment of survivors before seed set is important to prevent re-establishment.',
  'awaiting_review'
),
(
  'dddddddd-0001-0001-0001-000000000002',
  'bbbbbbbb-0001-0001-0001-000000000001',
  'cccccccc-0001-0001-0001-000000000001',
  'Section 1 Mid-Story Mechanical Treatment',
  'Mechanical Clearing',
  'Chainsaw and forestry mulching treatment of mid-story hardwood to open stand structure and prepare for prescribed fire reintroduction.',
  'high',
  'Essential',
  'planned',
  '2026-10-01',
  '2026-11-30',
  8500.00,
  TRUE,
  'This is the first step toward reintroducing fire to Section 1. Mechanical treatment creates the structure needed for a safe and effective prescribed burn.',
  'not_requested'
);

INSERT INTO public.budgets (id, property_id, name, budget_year, five_year_plan_start, estimated_total, status, client_visible_notes)
VALUES (
  'eeeeeeee-0001-0001-0001-000000000001',
  'bbbbbbbb-0001-0001-0001-000000000001',
  'Pinecrest Farm — 2026 Annual Plan',
  2026,
  2026,
  13500.00,
  'active',
  'Estimates reflect current field conditions and are subject to change based on contractor availability and seasonal conditions. SHC will confirm pricing before work begins.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.budget_items (budget_id, project_id, property_section_id, practice, classification, planned_year, planned_season, estimated_cost, sort_order)
VALUES
(
  'eeeeeeee-0001-0001-0001-000000000001',
  'dddddddd-0001-0001-0001-000000000001',
  'cccccccc-0001-0001-0001-000000000002',
  'Chinese Tallow Follow-Up Spot Treatment',
  'Recommended',
  2026, 'Summer', 3200.00, 1
),
(
  'eeeeeeee-0001-0001-0001-000000000001',
  NULL,
  'cccccccc-0001-0001-0001-000000000003',
  'Food Plot Weed Control',
  'Recommended',
  2026, 'Summer', 1800.00, 2
),
(
  'eeeeeeee-0001-0001-0001-000000000001',
  'dddddddd-0001-0001-0001-000000000002',
  'cccccccc-0001-0001-0001-000000000001',
  'Section 1 Mid-Story Mechanical Treatment',
  'Essential',
  2026, 'Fall', 8500.00, 3
);
