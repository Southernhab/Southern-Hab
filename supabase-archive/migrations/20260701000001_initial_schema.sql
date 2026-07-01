-- SHC Landowner Portal — Initial Schema
-- Migration: 20260701000001_initial_schema
-- Apply with: supabase db push  or  psql -f this-file.sql

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Utility: auto-update updated_at ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── profiles ─────────────────────────────────────────────────────────────────
-- One row per auth.users entry. role drives all permission checks.
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL DEFAULT '',
  last_name       TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL,
  phone           TEXT,
  role            TEXT NOT NULL DEFAULT 'client_viewer'
                  CHECK (role IN ('super_admin','staff_admin','field_staff',
                                  'client_owner','client_viewer')),
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name',  '')
  );
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── clients ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name           TEXT NOT NULL,
  display_name         TEXT NOT NULL,
  primary_contact_name TEXT,
  email                TEXT,
  phone                TEXT,
  mailing_address      TEXT,
  city                 TEXT,
  state                TEXT DEFAULT 'AL',
  postal_code          TEXT,
  notes_internal       TEXT,          -- never returned to client users
  status               TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','inactive','archived')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by           UUID REFERENCES auth.users(id),
  updated_by           UUID REFERENCES auth.users(id)
);
CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── client_users ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'client_viewer'
               CHECK (access_level IN ('client_owner','client_viewer')),
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  invited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at  TIMESTAMPTZ,
  UNIQUE (client_id, user_id)
);

-- ── properties ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.properties (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  name                     TEXT NOT NULL,
  description              TEXT,
  acreage                  NUMERIC(10,2),
  county                   TEXT,
  state                    TEXT DEFAULT 'AL',
  physical_address         TEXT,
  latitude                 NUMERIC(10,7),
  longitude                NUMERIC(10,7),
  parcel_numbers           TEXT,
  ownership_notes_internal TEXT,        -- never returned to client users
  management_summary_client TEXT,
  primary_objectives       TEXT,
  status                   TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','inactive','archived')),
  next_review_date         DATE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by               UUID REFERENCES auth.users(id),
  updated_by               UUID REFERENCES auth.users(id)
);
CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── property_sections ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.property_sections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  acres                 NUMERIC(10,2),
  habitat_type          TEXT,
  land_cover_type       TEXT,
  current_condition     TEXT,
  desired_condition     TEXT,
  management_stage      TEXT,
  progress_percent      SMALLINT CHECK (progress_percent BETWEEN 0 AND 100),
  primary_objectives    TEXT,
  target_species        TEXT,
  limiting_factors      TEXT,
  recommended_next_action TEXT,
  planned_season        TEXT,
  planned_year          SMALLINT,
  estimated_cost        NUMERIC(12,2),
  internal_notes        TEXT,           -- never returned to client users
  client_visible_notes  TEXT,
  sort_order            SMALLINT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID REFERENCES auth.users(id),
  updated_by            UUID REFERENCES auth.users(id)
);
CREATE TRIGGER trg_property_sections_updated_at
  BEFORE UPDATE ON public.property_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── projects ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  property_section_id   UUID REFERENCES public.property_sections(id),
  name                  TEXT NOT NULL,
  work_type             TEXT,
  description           TEXT,
  reason_for_recommendation TEXT,
  expected_result       TEXT,
  priority              TEXT CHECK (priority IN ('high','medium','low')),
  classification        TEXT CHECK (classification IN ('Essential','Recommended','Optional')),
  status                TEXT NOT NULL DEFAULT 'planned'
                        CHECK (status IN ('planned','scheduled','active','complete',
                                          'deferred','cancelled')),
  planned_start_date    DATE,
  planned_end_date      DATE,
  actual_start_date     DATE,
  actual_end_date       DATE,
  estimated_cost        NUMERIC(12,2),
  approved_cost         NUMERIC(12,2),
  committed_cost        NUMERIC(12,2),
  invoiced_cost         NUMERIC(12,2),
  paid_cost             NUMERIC(12,2),
  quantity              NUMERIC(12,2),
  quantity_unit         TEXT,
  assigned_staff_id     UUID REFERENCES auth.users(id),
  contractor_name       TEXT,
  client_review_status  TEXT DEFAULT 'not_requested'
                        CHECK (client_review_status IN (
                          'not_requested','awaiting_review','question',
                          'request_information','request_proposal',
                          'request_schedule_change','preliminary_approval','deferred')),
  client_visible        BOOLEAN NOT NULL DEFAULT FALSE,
  internal_notes        TEXT,           -- never returned to client users
  client_notes          TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID REFERENCES auth.users(id),
  updated_by            UUID REFERENCES auth.users(id)
);
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── project_actions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_actions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type    TEXT NOT NULL
                 CHECK (action_type IN (
                   'question','request_information','request_proposal',
                   'request_schedule_change','preliminary_approval','defer')),
  comments       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── work_history ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_history (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id             UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  property_section_id     UUID REFERENCES public.property_sections(id),
  project_id              UUID REFERENCES public.projects(id),
  work_type               TEXT,
  completion_date         DATE,
  acres_or_quantity       NUMERIC(12,2),
  scope                   TEXT,
  crew_or_contractor      TEXT,
  final_cost              NUMERIC(12,2),
  treatment_specifications TEXT,
  completion_notes        TEXT,
  inspection_result       TEXT,
  recommended_follow_up   TEXT,
  internal_notes          TEXT,          -- never returned to client users
  client_visible          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by              UUID REFERENCES auth.users(id),
  updated_by              UUID REFERENCES auth.users(id)
);
CREATE TRIGGER trg_work_history_updated_at
  BEFORE UPDATE ON public.work_history
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── monitoring_records ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.monitoring_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id         UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  property_section_id UUID REFERENCES public.property_sections(id),
  project_id          UUID REFERENCES public.projects(id),
  monitoring_type     TEXT,
  observation_date    DATE,
  summary             TEXT,
  measurements_json   JSONB DEFAULT '{}',
  interpretation      TEXT,
  internal_notes      TEXT,              -- never returned to client users
  client_visible      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES auth.users(id),
  updated_by          UUID REFERENCES auth.users(id)
);
CREATE TRIGGER trg_monitoring_records_updated_at
  BEFORE UPDATE ON public.monitoring_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── wildlife_surveys ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wildlife_surveys (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id               UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  property_section_id       UUID REFERENCES public.property_sections(id),
  survey_type               TEXT,
  survey_date               DATE,
  direct_observations_json  JSONB DEFAULT '{}',
  calculated_metrics_json   JSONB DEFAULT '{}',
  modeled_estimates_json    JSONB DEFAULT '{}',
  professional_interpretation TEXT,
  internal_notes            TEXT,        -- never returned to client users
  client_visible            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by                UUID REFERENCES auth.users(id),
  updated_by                UUID REFERENCES auth.users(id)
);
CREATE TRIGGER trg_wildlife_surveys_updated_at
  BEFORE UPDATE ON public.wildlife_surveys
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── harvest_records ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.harvest_records (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id            UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  property_section_id    UUID REFERENCES public.property_sections(id),
  species                TEXT,
  harvest_date           DATE,
  sex                    TEXT,
  age_class              TEXT,
  weight                 NUMERIC(8,2),
  antler_measurements_json JSONB DEFAULT '{}',
  notes                  TEXT,
  client_visible         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by             UUID REFERENCES auth.users(id)
);

-- ── budgets ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.budgets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  name                  TEXT NOT NULL,
  budget_year           SMALLINT,
  five_year_plan_start  SMALLINT,
  estimated_total       NUMERIC(12,2) DEFAULT 0,
  approved_total        NUMERIC(12,2) DEFAULT 0,
  committed_total       NUMERIC(12,2) DEFAULT 0,
  invoiced_total        NUMERIC(12,2) DEFAULT 0,
  paid_total            NUMERIC(12,2) DEFAULT 0,
  potential_cost_share  NUMERIC(12,2) DEFAULT 0,
  internal_notes        TEXT,           -- never returned to client users
  client_visible_notes  TEXT,
  status                TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','active','closed','archived')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID REFERENCES auth.users(id),
  updated_by            UUID REFERENCES auth.users(id)
);
CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── budget_items ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.budget_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id            UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  project_id           UUID REFERENCES public.projects(id),
  property_section_id  UUID REFERENCES public.property_sections(id),
  practice             TEXT,
  classification       TEXT CHECK (classification IN ('Essential','Recommended','Optional')),
  planned_year         SMALLINT,
  planned_season       TEXT,
  estimated_cost       NUMERIC(12,2) DEFAULT 0,
  approved_cost        NUMERIC(12,2) DEFAULT 0,
  committed_cost       NUMERIC(12,2) DEFAULT 0,
  invoiced_cost        NUMERIC(12,2) DEFAULT 0,
  paid_cost            NUMERIC(12,2) DEFAULT 0,
  cost_share_estimate  NUMERIC(12,2) DEFAULT 0,
  notes                TEXT,
  sort_order           SMALLINT NOT NULL DEFAULT 0
);

-- ── documents ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  property_id         UUID REFERENCES public.properties(id),
  property_section_id UUID REFERENCES public.property_sections(id),
  project_id          UUID REFERENCES public.projects(id),
  document_type       TEXT,
  title               TEXT NOT NULL,
  description         TEXT,
  storage_path        TEXT NOT NULL,
  original_filename   TEXT NOT NULL,
  mime_type           TEXT,
  file_size           BIGINT,
  document_status     TEXT NOT NULL DEFAULT 'internal'
                      CHECK (document_status IN (
                        'internal','draft','client_review','published','archived')),
  client_visible      BOOLEAN NOT NULL DEFAULT FALSE,
  published_at        TIMESTAMPTZ,
  internal_notes      TEXT,             -- never returned to client users
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES auth.users(id),
  updated_by          UUID REFERENCES auth.users(id)
);
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── photographs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.photographs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  property_id          UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  property_section_id  UUID REFERENCES public.property_sections(id),
  project_id           UUID REFERENCES public.projects(id),
  monitoring_record_id UUID REFERENCES public.monitoring_records(id),
  category             TEXT,
  caption              TEXT,
  taken_at             DATE,
  storage_path         TEXT NOT NULL,
  client_visible       BOOLEAN NOT NULL DEFAULT FALSE,
  latitude             NUMERIC(10,7),
  longitude            NUMERIC(10,7),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by           UUID REFERENCES auth.users(id)
);

-- ── arcgis_maps ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.arcgis_maps (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id               UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  property_section_id       UUID REFERENCES public.property_sections(id),
  title                     TEXT NOT NULL,
  description               TEXT,
  arcgis_item_id            TEXT,
  arcgis_webmap_url         TEXT,
  arcgis_feature_service_url TEXT,
  arcgis_experience_url     TEXT,
  embed_url                 TEXT,
  layer_configuration_json  JSONB DEFAULT '{}',
  thumbnail_storage_path    TEXT,
  client_visible            BOOLEAN NOT NULL DEFAULT FALSE,
  active                    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by                UUID REFERENCES auth.users(id),
  updated_by                UUID REFERENCES auth.users(id)
);
CREATE TRIGGER trg_arcgis_maps_updated_at
  BEFORE UPDATE ON public.arcgis_maps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── map_files ─────────────────────────────────────────────────────────────────
-- Stores uploaded GIS source files (GeoJSON, KML, KMZ, shapefiles, PDFs, images).
-- Shapefiles are not processed in-browser; staff links the ArcGIS item after publishing.
CREATE TABLE IF NOT EXISTS public.map_files (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id         UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  property_section_id UUID REFERENCES public.property_sections(id),
  title               TEXT NOT NULL,
  file_type           TEXT CHECK (file_type IN (
                        'geojson','kml','kmz','shapefile_zip',
                        'pdf_map','map_image','other')),
  storage_path        TEXT NOT NULL,
  original_filename   TEXT NOT NULL,
  mime_type           TEXT,
  coordinate_system   TEXT,
  description         TEXT,
  client_visible      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES auth.users(id)
);

-- ── messages ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  property_id         UUID REFERENCES public.properties(id),
  property_section_id UUID REFERENCES public.property_sections(id),
  project_id          UUID REFERENCES public.projects(id),
  wildlife_survey_id  UUID REFERENCES public.wildlife_surveys(id),
  document_id         UUID REFERENCES public.documents(id),
  subject             TEXT NOT NULL,
  category            TEXT CHECK (category IN (
                        'general','question','site_visit_request','proposal_request',
                        'project_question','report_question','property_issue','other')),
  status              TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','in_progress','resolved','closed')),
  created_by          UUID NOT NULL REFERENCES auth.users(id),
  assigned_to         UUID REFERENCES auth.users(id),
  client_visible      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── message_entries ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  sender_id     UUID NOT NULL REFERENCES auth.users(id),
  body          TEXT NOT NULL,
  internal_only BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = staff only, never sent to client
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── inquiries ─────────────────────────────────────────────────────────────────
-- Public submissions from contact forms; no auth required to insert.
CREATE TABLE IF NOT EXISTS public.inquiries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_type      TEXT CHECK (inquiry_type IN ('private_land','industrial_municipal','general')),
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  organization      TEXT,
  property_location TEXT,
  property_type     TEXT,
  acreage           TEXT,
  requested_services TEXT,
  message           TEXT,
  referral_source   TEXT,
  status            TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','reviewed','contacted','converted','closed')),
  assigned_to       UUID REFERENCES auth.users(id),
  source_page       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── access_requests ───────────────────────────────────────────────────────────
-- Submitted by prospective clients; staff reviews before creating an account.
CREATE TABLE IF NOT EXISTS public.access_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  client_name   TEXT,
  property_name TEXT,
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','denied','already_exists')),
  reviewed_by   UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ
);

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  title               TEXT NOT NULL,
  body                TEXT,
  read_at             TIMESTAMPTZ,
  related_record_type TEXT,
  related_record_id   UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── audit_log ─────────────────────────────────────────────────────────────────
-- Immutable — no UPDATE or DELETE via normal interface.
CREATE TABLE IF NOT EXISTS public.audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id),
  action          TEXT NOT NULL,
  table_name      TEXT NOT NULL,
  record_id       UUID,
  old_values_json JSONB,
  new_values_json JSONB,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger function that writes to audit_log for key tables
CREATE OR REPLACE FUNCTION public.write_audit_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_values_json)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD)::jsonb);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_values_json, new_values_json)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, new_values_json)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, row_to_json(NEW)::jsonb);
    RETURN NEW;
  END IF;
END;
$$;

-- Attach audit triggers to financial and contract-sensitive tables
CREATE TRIGGER audit_projects   AFTER INSERT OR UPDATE OR DELETE ON public.projects   FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_budgets    AFTER INSERT OR UPDATE OR DELETE ON public.budgets    FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_documents  AFTER INSERT OR UPDATE OR DELETE ON public.documents  FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_clients    AFTER INSERT OR UPDATE OR DELETE ON public.clients    FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_properties AFTER INSERT OR UPDATE OR DELETE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();
CREATE TRIGGER audit_client_users AFTER INSERT OR UPDATE OR DELETE ON public.client_users FOR EACH ROW EXECUTE FUNCTION public.write_audit_log();

-- ── system_settings ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key       TEXT NOT NULL UNIQUE,
  setting_value_json JSONB NOT NULL DEFAULT '{}',
  updated_by        UUID REFERENCES auth.users(id),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default system settings
INSERT INTO public.system_settings (setting_key, setting_value_json) VALUES
  ('require_staff_approval_for_client_viewers', 'true'),
  ('client_messaging_enabled', 'true'),
  ('portal_notice_project_actions',
   '"Portal actions (preliminary approval, defer, or respond) do not replace a signed contract or formal written authorization. SHC staff will follow up to confirm before work begins."')
ON CONFLICT (setting_key) DO NOTHING;
