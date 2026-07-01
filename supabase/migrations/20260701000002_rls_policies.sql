-- SHC Landowner Portal — Row Level Security Policies
-- Migration: 20260701000002_rls_policies
-- Apply after: 20260701000001_initial_schema.sql

-- ── Role helper functions (SECURITY DEFINER — run as owner, not caller) ──────

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT STABLE LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN STABLE LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_user_role() IN ('super_admin','staff_admin','field_staff');
$$;

CREATE OR REPLACE FUNCTION public.is_admin_role()
RETURNS BOOLEAN STABLE LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_user_role() IN ('super_admin','staff_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN STABLE LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_user_role() = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.current_user_client_ids()
RETURNS UUID[] STABLE LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(ARRAY_AGG(client_id), '{}')
  FROM public.client_users
  WHERE user_id = auth.uid() AND active = true;
$$;

CREATE OR REPLACE FUNCTION public.current_user_property_ids()
RETURNS UUID[] STABLE LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(ARRAY_AGG(p.id), '{}')
  FROM public.properties p
  WHERE p.client_id = ANY(public.current_user_client_ids());
$$;

-- ── Enable RLS on every production table ─────────────────────────────────────
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_actions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_history      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wildlife_surveys  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photographs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arcgis_maps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_files         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings   ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_staff" ON public.profiles
  FOR SELECT USING (public.is_staff());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- clients cannot elevate their own role
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (public.is_admin_role());

-- ── clients ───────────────────────────────────────────────────────────────────
-- Staff see all clients; client users see only their assigned client(s).
-- notes_internal is excluded at the view layer, not here.
CREATE POLICY "clients_select_staff" ON public.clients
  FOR SELECT USING (public.is_staff());

CREATE POLICY "clients_select_client" ON public.clients
  FOR SELECT USING (id = ANY(public.current_user_client_ids()));

CREATE POLICY "clients_insert_admin" ON public.clients
  FOR INSERT WITH CHECK (public.is_admin_role());

CREATE POLICY "clients_update_admin" ON public.clients
  FOR UPDATE USING (public.is_admin_role());

-- Soft-delete only: set status = 'archived'. Super admin required for hard changes.
CREATE POLICY "clients_delete_super" ON public.clients
  FOR DELETE USING (public.is_super_admin());

-- ── client_users ──────────────────────────────────────────────────────────────
CREATE POLICY "client_users_select_staff" ON public.client_users
  FOR SELECT USING (public.is_staff());

-- client_owner may list other users in the same client
CREATE POLICY "client_users_select_owner" ON public.client_users
  FOR SELECT USING (
    client_id = ANY(public.current_user_client_ids()) AND
    public.current_user_role() = 'client_owner'
  );

-- Users can see their own entry
CREATE POLICY "client_users_select_self" ON public.client_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "client_users_insert_admin" ON public.client_users
  FOR INSERT WITH CHECK (public.is_admin_role());

CREATE POLICY "client_users_update_admin" ON public.client_users
  FOR UPDATE USING (public.is_admin_role());

CREATE POLICY "client_users_delete_admin" ON public.client_users
  FOR DELETE USING (public.is_admin_role());

-- ── properties ────────────────────────────────────────────────────────────────
CREATE POLICY "properties_select_staff" ON public.properties
  FOR SELECT USING (public.is_staff());

CREATE POLICY "properties_select_client" ON public.properties
  FOR SELECT USING (client_id = ANY(public.current_user_client_ids()));

CREATE POLICY "properties_insert_admin" ON public.properties
  FOR INSERT WITH CHECK (public.is_admin_role());

CREATE POLICY "properties_update_admin" ON public.properties
  FOR UPDATE USING (public.is_admin_role());

CREATE POLICY "properties_delete_super" ON public.properties
  FOR DELETE USING (public.is_super_admin());

-- ── property_sections ─────────────────────────────────────────────────────────
-- Clients can see all sections of their properties; internal_notes excluded by view.
CREATE POLICY "property_sections_select_staff" ON public.property_sections
  FOR SELECT USING (public.is_staff());

CREATE POLICY "property_sections_select_client" ON public.property_sections
  FOR SELECT USING (property_id = ANY(public.current_user_property_ids()));

CREATE POLICY "property_sections_insert_admin" ON public.property_sections
  FOR INSERT WITH CHECK (public.is_admin_role());

CREATE POLICY "property_sections_update_admin" ON public.property_sections
  FOR UPDATE USING (public.is_admin_role());

CREATE POLICY "property_sections_delete_admin" ON public.property_sections
  FOR DELETE USING (public.is_admin_role());

-- ── projects ─────────────────────────────────────────────────────────────────
CREATE POLICY "projects_select_staff" ON public.projects
  FOR SELECT USING (public.is_staff());

-- Clients see only client_visible=true projects on their properties.
-- internal_notes excluded by view.
CREATE POLICY "projects_select_client" ON public.projects
  FOR SELECT USING (
    client_visible = true AND
    property_id = ANY(public.current_user_property_ids())
  );

CREATE POLICY "projects_insert_admin" ON public.projects
  FOR INSERT WITH CHECK (public.is_admin_role());

-- field_staff may update assigned projects
CREATE POLICY "projects_update_staff" ON public.projects
  FOR UPDATE USING (
    public.is_admin_role() OR
    (public.current_user_role() = 'field_staff' AND assigned_staff_id = auth.uid())
  );

CREATE POLICY "projects_delete_super" ON public.projects
  FOR DELETE USING (public.is_super_admin());

-- ── project_actions ───────────────────────────────────────────────────────────
CREATE POLICY "project_actions_select_staff" ON public.project_actions
  FOR SELECT USING (public.is_staff());

-- Client can see their own project actions
CREATE POLICY "project_actions_select_client" ON public.project_actions
  FOR SELECT USING (client_user_id = auth.uid());

-- client_owner may insert; client_viewer may not
CREATE POLICY "project_actions_insert_client_owner" ON public.project_actions
  FOR INSERT WITH CHECK (
    public.current_user_role() = 'client_owner' AND
    client_user_id = auth.uid()
  );

-- ── work_history ──────────────────────────────────────────────────────────────
CREATE POLICY "work_history_select_staff" ON public.work_history
  FOR SELECT USING (public.is_staff());

CREATE POLICY "work_history_select_client" ON public.work_history
  FOR SELECT USING (
    client_visible = true AND
    property_id = ANY(public.current_user_property_ids())
  );

CREATE POLICY "work_history_insert_staff" ON public.work_history
  FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "work_history_update_admin" ON public.work_history
  FOR UPDATE USING (public.is_admin_role());

CREATE POLICY "work_history_delete_super" ON public.work_history
  FOR DELETE USING (public.is_super_admin());

-- ── monitoring_records ────────────────────────────────────────────────────────
CREATE POLICY "monitoring_select_staff" ON public.monitoring_records
  FOR SELECT USING (public.is_staff());

CREATE POLICY "monitoring_select_client" ON public.monitoring_records
  FOR SELECT USING (
    client_visible = true AND
    property_id = ANY(public.current_user_property_ids())
  );

CREATE POLICY "monitoring_insert_staff" ON public.monitoring_records
  FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "monitoring_update_admin" ON public.monitoring_records
  FOR UPDATE USING (public.is_admin_role());

-- ── wildlife_surveys ──────────────────────────────────────────────────────────
CREATE POLICY "wildlife_surveys_select_staff" ON public.wildlife_surveys
  FOR SELECT USING (public.is_staff());

CREATE POLICY "wildlife_surveys_select_client" ON public.wildlife_surveys
  FOR SELECT USING (
    client_visible = true AND
    property_id = ANY(public.current_user_property_ids())
  );

CREATE POLICY "wildlife_surveys_insert_staff" ON public.wildlife_surveys
  FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "wildlife_surveys_update_admin" ON public.wildlife_surveys
  FOR UPDATE USING (public.is_admin_role());

-- ── harvest_records ───────────────────────────────────────────────────────────
CREATE POLICY "harvest_records_select_staff" ON public.harvest_records
  FOR SELECT USING (public.is_staff());

CREATE POLICY "harvest_records_select_client" ON public.harvest_records
  FOR SELECT USING (
    client_visible = true AND
    property_id = ANY(public.current_user_property_ids())
  );

CREATE POLICY "harvest_records_insert_staff" ON public.harvest_records
  FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "harvest_records_update_admin" ON public.harvest_records
  FOR UPDATE USING (public.is_admin_role());

-- ── budgets ───────────────────────────────────────────────────────────────────
CREATE POLICY "budgets_select_staff" ON public.budgets
  FOR SELECT USING (public.is_staff());

-- Clients see only budgets where status is active/closed (not draft/archived)
-- and property belongs to them. internal_notes excluded by view.
CREATE POLICY "budgets_select_client" ON public.budgets
  FOR SELECT USING (
    status IN ('active','closed') AND
    property_id = ANY(public.current_user_property_ids())
  );

CREATE POLICY "budgets_insert_admin" ON public.budgets
  FOR INSERT WITH CHECK (public.is_admin_role());

CREATE POLICY "budgets_update_admin" ON public.budgets
  FOR UPDATE USING (public.is_admin_role());

-- ── budget_items ──────────────────────────────────────────────────────────────
CREATE POLICY "budget_items_select_staff" ON public.budget_items
  FOR SELECT USING (public.is_staff());

CREATE POLICY "budget_items_select_client" ON public.budget_items
  FOR SELECT USING (
    budget_id IN (
      SELECT id FROM public.budgets
      WHERE status IN ('active','closed')
        AND property_id = ANY(public.current_user_property_ids())
    )
  );

CREATE POLICY "budget_items_insert_admin" ON public.budget_items
  FOR INSERT WITH CHECK (public.is_admin_role());

CREATE POLICY "budget_items_update_admin" ON public.budget_items
  FOR UPDATE USING (public.is_admin_role());

-- ── documents ─────────────────────────────────────────────────────────────────
CREATE POLICY "documents_select_staff" ON public.documents
  FOR SELECT USING (public.is_staff());

-- Clients see only published documents for their client
CREATE POLICY "documents_select_client" ON public.documents
  FOR SELECT USING (
    client_visible = true AND
    document_status = 'published' AND
    client_id = ANY(public.current_user_client_ids())
  );

CREATE POLICY "documents_insert_admin" ON public.documents
  FOR INSERT WITH CHECK (public.is_admin_role());

-- field_staff may upload (insert) documents
CREATE POLICY "documents_insert_staff" ON public.documents
  FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "documents_update_admin" ON public.documents
  FOR UPDATE USING (public.is_admin_role());

-- ── photographs ───────────────────────────────────────────────────────────────
CREATE POLICY "photographs_select_staff" ON public.photographs
  FOR SELECT USING (public.is_staff());

CREATE POLICY "photographs_select_client" ON public.photographs
  FOR SELECT USING (
    client_visible = true AND
    client_id = ANY(public.current_user_client_ids())
  );

CREATE POLICY "photographs_insert_staff" ON public.photographs
  FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "photographs_update_admin" ON public.photographs
  FOR UPDATE USING (public.is_admin_role());

-- ── arcgis_maps ───────────────────────────────────────────────────────────────
CREATE POLICY "arcgis_maps_select_staff" ON public.arcgis_maps
  FOR SELECT USING (public.is_staff());

CREATE POLICY "arcgis_maps_select_client" ON public.arcgis_maps
  FOR SELECT USING (
    client_visible = true AND
    active = true AND
    property_id = ANY(public.current_user_property_ids())
  );

CREATE POLICY "arcgis_maps_insert_admin" ON public.arcgis_maps
  FOR INSERT WITH CHECK (public.is_admin_role());

CREATE POLICY "arcgis_maps_update_admin" ON public.arcgis_maps
  FOR UPDATE USING (public.is_admin_role());

-- ── map_files ─────────────────────────────────────────────────────────────────
CREATE POLICY "map_files_select_staff" ON public.map_files
  FOR SELECT USING (public.is_staff());

CREATE POLICY "map_files_select_client" ON public.map_files
  FOR SELECT USING (
    client_visible = true AND
    property_id = ANY(public.current_user_property_ids())
  );

CREATE POLICY "map_files_insert_admin" ON public.map_files
  FOR INSERT WITH CHECK (public.is_admin_role());

-- ── messages ─────────────────────────────────────────────────────────────────
CREATE POLICY "messages_select_staff" ON public.messages
  FOR SELECT USING (public.is_staff());

CREATE POLICY "messages_select_client" ON public.messages
  FOR SELECT USING (
    client_visible = true AND
    client_id = ANY(public.current_user_client_ids())
  );

CREATE POLICY "messages_insert_client" ON public.messages
  FOR INSERT WITH CHECK (
    client_id = ANY(public.current_user_client_ids()) AND
    created_by = auth.uid() AND
    client_visible = true
  );

CREATE POLICY "messages_update_staff" ON public.messages
  FOR UPDATE USING (public.is_staff());

CREATE POLICY "messages_update_client_owner" ON public.messages
  FOR UPDATE USING (
    public.current_user_role() = 'client_owner' AND
    created_by = auth.uid()
  );

-- ── message_entries ───────────────────────────────────────────────────────────
CREATE POLICY "message_entries_select_staff" ON public.message_entries
  FOR SELECT USING (public.is_staff());

-- Clients see entries where internal_only = false and belong to their messages
CREATE POLICY "message_entries_select_client" ON public.message_entries
  FOR SELECT USING (
    internal_only = false AND
    message_id IN (
      SELECT id FROM public.messages
      WHERE client_visible = true
        AND client_id = ANY(public.current_user_client_ids())
    )
  );

-- Clients (non-viewer) may send replies
CREATE POLICY "message_entries_insert_client" ON public.message_entries
  FOR INSERT WITH CHECK (
    public.current_user_role() IN ('client_owner','client_viewer') AND
    internal_only = false AND
    sender_id = auth.uid() AND
    message_id IN (
      SELECT id FROM public.messages
      WHERE client_id = ANY(public.current_user_client_ids())
    )
  );

CREATE POLICY "message_entries_insert_staff" ON public.message_entries
  FOR INSERT WITH CHECK (public.is_staff() AND sender_id = auth.uid());

-- ── inquiries ─────────────────────────────────────────────────────────────────
-- Public INSERT without auth (handled via Edge Function with service-role key).
-- Direct inserts from anon are disallowed; the Edge Function bypasses RLS using service role.
CREATE POLICY "inquiries_select_staff" ON public.inquiries
  FOR SELECT USING (public.is_staff());

CREATE POLICY "inquiries_update_staff" ON public.inquiries
  FOR UPDATE USING (public.is_staff());

-- ── access_requests ───────────────────────────────────────────────────────────
-- Same pattern as inquiries: Edge Function handles inserts.
CREATE POLICY "access_requests_select_staff" ON public.access_requests
  FOR SELECT USING (public.is_staff());

CREATE POLICY "access_requests_update_staff" ON public.access_requests
  FOR UPDATE USING (public.is_admin_role());

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_staff" ON public.notifications
  FOR INSERT WITH CHECK (public.is_staff());

-- ── audit_log ─────────────────────────────────────────────────────────────────
-- Only super_admin may read audit logs. No UPDATE or DELETE allowed via RLS.
CREATE POLICY "audit_log_select_super" ON public.audit_log
  FOR SELECT USING (public.is_super_admin());

-- INSERT is handled only by trigger (write_audit_log), which runs as SECURITY DEFINER.
-- No direct INSERT policy needed for regular users.

-- ── system_settings ───────────────────────────────────────────────────────────
CREATE POLICY "system_settings_select_staff" ON public.system_settings
  FOR SELECT USING (public.is_staff());

CREATE POLICY "system_settings_update_super" ON public.system_settings
  FOR UPDATE USING (public.is_super_admin());
