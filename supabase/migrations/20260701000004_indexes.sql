-- SHC Landowner Portal — Performance Indexes
-- Migration: 20260701000004_indexes
-- Apply after: 20260701000003_views.sql

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role        ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active       ON public.profiles(active);

-- client_users — most frequently queried for RLS checks
CREATE INDEX IF NOT EXISTS idx_client_users_user_id   ON public.client_users(user_id);
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON public.client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_active     ON public.client_users(active);

-- properties
CREATE INDEX IF NOT EXISTS idx_properties_client_id   ON public.properties(client_id);
CREATE INDEX IF NOT EXISTS idx_properties_status       ON public.properties(status);

-- property_sections
CREATE INDEX IF NOT EXISTS idx_property_sections_property_id ON public.property_sections(property_id);
CREATE INDEX IF NOT EXISTS idx_property_sections_sort        ON public.property_sections(property_id, sort_order);

-- projects
CREATE INDEX IF NOT EXISTS idx_projects_property_id         ON public.projects(property_id);
CREATE INDEX IF NOT EXISTS idx_projects_section_id          ON public.projects(property_section_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_visible      ON public.projects(property_id, client_visible);
CREATE INDEX IF NOT EXISTS idx_projects_status              ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_review_status       ON public.projects(client_review_status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_staff      ON public.projects(assigned_staff_id);

-- project_actions
CREATE INDEX IF NOT EXISTS idx_project_actions_project_id ON public.project_actions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_actions_user_id    ON public.project_actions(client_user_id);

-- work_history
CREATE INDEX IF NOT EXISTS idx_work_history_property_id  ON public.work_history(property_id);
CREATE INDEX IF NOT EXISTS idx_work_history_section_id   ON public.work_history(property_section_id);
CREATE INDEX IF NOT EXISTS idx_work_history_completion   ON public.work_history(completion_date DESC);

-- monitoring_records
CREATE INDEX IF NOT EXISTS idx_monitoring_property_id ON public.monitoring_records(property_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_date        ON public.monitoring_records(observation_date DESC);

-- wildlife_surveys
CREATE INDEX IF NOT EXISTS idx_wildlife_property_id ON public.wildlife_surveys(property_id);
CREATE INDEX IF NOT EXISTS idx_wildlife_date        ON public.wildlife_surveys(survey_date DESC);

-- harvest_records
CREATE INDEX IF NOT EXISTS idx_harvest_property_id ON public.harvest_records(property_id);
CREATE INDEX IF NOT EXISTS idx_harvest_date        ON public.harvest_records(harvest_date DESC);

-- budgets
CREATE INDEX IF NOT EXISTS idx_budgets_property_id  ON public.budgets(property_id);
CREATE INDEX IF NOT EXISTS idx_budgets_year         ON public.budgets(budget_year);
CREATE INDEX IF NOT EXISTS idx_budgets_status       ON public.budgets(status);

-- budget_items
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id  ON public.budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_project_id ON public.budget_items(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_sort        ON public.budget_items(budget_id, sort_order);

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_client_id     ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_property_id   ON public.documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_status        ON public.documents(document_status);
CREATE INDEX IF NOT EXISTS idx_documents_visible       ON public.documents(client_id, client_visible, document_status);

-- photographs
CREATE INDEX IF NOT EXISTS idx_photographs_client_id   ON public.photographs(client_id);
CREATE INDEX IF NOT EXISTS idx_photographs_property_id ON public.photographs(property_id);

-- arcgis_maps
CREATE INDEX IF NOT EXISTS idx_arcgis_maps_property_id ON public.arcgis_maps(property_id);
CREATE INDEX IF NOT EXISTS idx_arcgis_maps_visible     ON public.arcgis_maps(property_id, client_visible, active);

-- map_files
CREATE INDEX IF NOT EXISTS idx_map_files_property_id ON public.map_files(property_id);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_client_id  ON public.messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_status     ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_assigned   ON public.messages(assigned_to);
CREATE INDEX IF NOT EXISTS idx_messages_updated    ON public.messages(updated_at DESC);

-- message_entries
CREATE INDEX IF NOT EXISTS idx_message_entries_message_id ON public.message_entries(message_id);
CREATE INDEX IF NOT EXISTS idx_message_entries_sender     ON public.message_entries(sender_id);

-- inquiries
CREATE INDEX IF NOT EXISTS idx_inquiries_status  ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON public.inquiries(created_at DESC);

-- access_requests
CREATE INDEX IF NOT EXISTS idx_access_requests_status  ON public.access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_created ON public.access_requests(created_at DESC);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON public.notifications(user_id, read_at) WHERE read_at IS NULL;

-- audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id    ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table      ON public.audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created    ON public.audit_log(created_at DESC);
