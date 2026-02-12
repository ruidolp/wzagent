-- Add flow editor fields to tenants table
-- Migration 003

ALTER TABLE tenants
  ADD COLUMN new_user_flow_id TEXT REFERENCES flows(id),
  ADD COLUMN known_user_flow_id TEXT REFERENCES flows(id);

CREATE INDEX idx_tenants_new_user_flow ON tenants(new_user_flow_id);
CREATE INDEX idx_tenants_known_user_flow ON tenants(known_user_flow_id);
