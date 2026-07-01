-- SHC Landowner Portal — Client-Safe Views
-- Migration: 20260701000003_views
-- Apply after: 20260701000002_rls_policies.sql
--
-- These views are queried by the portal frontend for client users.
-- They explicitly omit every internal field. RLS on the underlying tables
-- still applies because views use SECURITY INVOKER by default (in PostgreSQL 15+).
-- On earlier PostgreSQL, security_barrier=true is set to prevent policy bypass.

-- ── v_client_properties ───────────────────────────────────────────────────────
-- Omits: ownership_notes_internal
CREATE OR REPLACE VIEW public.v_client_properties
  WITH (security_barrier = true) AS
SELECT
  id,
  client_id,
  name,
  description,
  acreage,
  county,
  state,
  physical_address,
  latitude,
  longitude,
  parcel_numbers,
  management_summary_client,
  primary_objectives,
  status,
  next_review_date,
  created_at,
  updated_at
FROM public.properties;

-- ── v_client_property_sections ────────────────────────────────────────────────
-- Omits: internal_notes
CREATE OR REPLACE VIEW public.v_client_property_sections
  WITH (security_barrier = true) AS
SELECT
  id,
  property_id,
  name,
  acres,
  habitat_type,
  land_cover_type,
  current_condition,
  desired_condition,
  management_stage,
  progress_percent,
  primary_objectives,
  target_species,
  limiting_factors,
  recommended_next_action,
  planned_season,
  planned_year,
  estimated_cost,
  client_visible_notes,
  sort_order,
  created_at,
  updated_at
FROM public.property_sections;

-- ── v_client_projects ─────────────────────────────────────────────────────────
-- Omits: internal_notes, assigned_staff_id, contractor_name details beyond client-facing
-- Only includes client_visible = true rows via RLS on the base table.
CREATE OR REPLACE VIEW public.v_client_projects
  WITH (security_barrier = true) AS
SELECT
  id,
  property_id,
  property_section_id,
  name,
  work_type,
  description,
  reason_for_recommendation,
  expected_result,
  priority,
  classification,
  status,
  planned_start_date,
  planned_end_date,
  actual_start_date,
  actual_end_date,
  estimated_cost,
  approved_cost,
  invoiced_cost,
  paid_cost,
  quantity,
  quantity_unit,
  client_review_status,
  client_notes,
  client_visible,
  created_at,
  updated_at
FROM public.projects
WHERE client_visible = true;

-- ── v_client_work_history ─────────────────────────────────────────────────────
-- Omits: internal_notes, crew_or_contractor (kept as it is client-appropriate)
CREATE OR REPLACE VIEW public.v_client_work_history
  WITH (security_barrier = true) AS
SELECT
  id,
  property_id,
  property_section_id,
  project_id,
  work_type,
  completion_date,
  acres_or_quantity,
  scope,
  crew_or_contractor,
  final_cost,
  treatment_specifications,
  completion_notes,
  inspection_result,
  recommended_follow_up,
  client_visible,
  created_at,
  updated_at
FROM public.work_history
WHERE client_visible = true;

-- ── v_client_wildlife_surveys ─────────────────────────────────────────────────
-- Omits: internal_notes
CREATE OR REPLACE VIEW public.v_client_wildlife_surveys
  WITH (security_barrier = true) AS
SELECT
  id,
  property_id,
  property_section_id,
  survey_type,
  survey_date,
  direct_observations_json,
  calculated_metrics_json,
  modeled_estimates_json,
  professional_interpretation,
  client_visible,
  created_at,
  updated_at
FROM public.wildlife_surveys
WHERE client_visible = true;

-- ── v_client_monitoring_records ───────────────────────────────────────────────
-- Omits: internal_notes
CREATE OR REPLACE VIEW public.v_client_monitoring_records
  WITH (security_barrier = true) AS
SELECT
  id,
  property_id,
  property_section_id,
  project_id,
  monitoring_type,
  observation_date,
  summary,
  measurements_json,
  interpretation,
  client_visible,
  created_at,
  updated_at
FROM public.monitoring_records
WHERE client_visible = true;

-- ── v_client_budgets ──────────────────────────────────────────────────────────
-- Omits: internal_notes
CREATE OR REPLACE VIEW public.v_client_budgets
  WITH (security_barrier = true) AS
SELECT
  id,
  property_id,
  name,
  budget_year,
  five_year_plan_start,
  estimated_total,
  approved_total,
  committed_total,
  invoiced_total,
  paid_total,
  potential_cost_share,
  client_visible_notes,
  status,
  created_at,
  updated_at
FROM public.budgets
WHERE status IN ('active','closed');

-- ── v_client_documents ────────────────────────────────────────────────────────
-- Omits: internal_notes, storage_path (clients download via signed URL RPC)
CREATE OR REPLACE VIEW public.v_client_documents
  WITH (security_barrier = true) AS
SELECT
  id,
  client_id,
  property_id,
  property_section_id,
  project_id,
  document_type,
  title,
  description,
  original_filename,
  mime_type,
  file_size,
  document_status,
  client_visible,
  published_at,
  created_at,
  updated_at
FROM public.documents
WHERE client_visible = true AND document_status = 'published';

-- ── v_client_messages ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_client_messages
  WITH (security_barrier = true) AS
SELECT
  id,
  client_id,
  property_id,
  property_section_id,
  project_id,
  wildlife_survey_id,
  document_id,
  subject,
  category,
  status,
  created_by,
  client_visible,
  created_at,
  updated_at
FROM public.messages
WHERE client_visible = true;

-- ── v_client_message_entries ──────────────────────────────────────────────────
-- Omits: internal_only=true entries
CREATE OR REPLACE VIEW public.v_client_message_entries
  WITH (security_barrier = true) AS
SELECT
  id,
  message_id,
  sender_id,
  body,
  created_at
FROM public.message_entries
WHERE internal_only = false;

-- ── v_portal_overview ─────────────────────────────────────────────────────────
-- Aggregated overview data for a single property; call with property_id filter.
CREATE OR REPLACE VIEW public.v_portal_overview
  WITH (security_barrier = true) AS
SELECT
  p.id                                                                        AS property_id,
  p.client_id,
  p.name                                                                      AS property_name,
  p.acreage,
  p.county,
  p.state,
  p.management_summary_client,
  p.next_review_date,
  -- Management progress: average of section progress
  (SELECT ROUND(AVG(ps.progress_percent))
   FROM public.property_sections ps WHERE ps.property_id = p.id)             AS management_progress_pct,
  -- Work completed this calendar year
  (SELECT COUNT(*)
   FROM public.work_history wh
   WHERE wh.property_id = p.id
     AND wh.client_visible = true
     AND EXTRACT(YEAR FROM wh.completion_date) = EXTRACT(YEAR FROM NOW()))   AS work_completed_this_year,
  -- Active projects
  (SELECT COUNT(*)
   FROM public.projects pr
   WHERE pr.property_id = p.id
     AND pr.client_visible = true
     AND pr.status = 'active')                                                AS active_projects,
  -- Projects awaiting client review
  (SELECT COUNT(*)
   FROM public.projects pr
   WHERE pr.property_id = p.id
     AND pr.client_visible = true
     AND pr.client_review_status = 'awaiting_review')                        AS projects_awaiting_review,
  -- Current-year estimated total
  (SELECT COALESCE(SUM(bi.estimated_cost), 0)
   FROM public.budget_items bi
   JOIN public.budgets b ON b.id = bi.budget_id
   WHERE b.property_id = p.id
     AND b.budget_year = EXTRACT(YEAR FROM NOW())
     AND b.status IN ('active','closed'))                                     AS current_year_estimated,
  -- Five-year estimated total
  (SELECT COALESCE(SUM(bi.estimated_cost), 0)
   FROM public.budget_items bi
   JOIN public.budgets b ON b.id = bi.budget_id
   WHERE b.property_id = p.id
     AND b.status IN ('active','closed'))                                     AS five_year_estimated
FROM public.properties p;

-- ── Secure signed-URL RPC ─────────────────────────────────────────────────────
-- Generates a short-lived signed download URL for a document the client owns.
-- Runs as SECURITY DEFINER so it can access storage; verifies ownership first.
CREATE OR REPLACE FUNCTION public.get_document_download_url(p_document_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_storage_path TEXT;
  v_client_id    UUID;
BEGIN
  -- Verify the requesting user owns this document
  SELECT d.storage_path, d.client_id
  INTO v_storage_path, v_client_id
  FROM public.documents d
  WHERE d.id = p_document_id
    AND d.client_visible = true
    AND d.document_status = 'published';

  IF v_storage_path IS NULL THEN
    RAISE EXCEPTION 'Document not found or not accessible';
  END IF;

  IF NOT (v_client_id = ANY(public.current_user_client_ids())) AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Return the storage path; the frontend calls supabase.storage.from().createSignedUrl()
  -- using the anon key — Supabase storage policies enforce access there.
  RETURN v_storage_path;
END;
$$;
