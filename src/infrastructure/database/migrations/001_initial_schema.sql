-- WIRC Initial Schema Migration
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE tenants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Configuración
  session_timeout_minutes INTEGER DEFAULT 30,
  welcome_message_known TEXT,
  welcome_message_new TEXT,
  default_flow_id TEXT,
  timezone TEXT DEFAULT 'America/Santiago',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_deleted ON tenants(deleted_at);

-- ============================================================
-- WHATSAPP ACCOUNTS
-- ============================================================
CREATE TABLE whatsapp_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identificadores de Meta
  phone_number TEXT NOT NULL UNIQUE,
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT NOT NULL,

  -- Credenciales
  access_token TEXT NOT NULL,
  webhook_verify_token TEXT NOT NULL,

  status TEXT DEFAULT 'active',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_wa_accounts_tenant ON whatsapp_accounts(tenant_id);
CREATE INDEX idx_wa_accounts_phone_number_id ON whatsapp_accounts(phone_number_id);

-- ============================================================
-- USERS (WhatsApp end-users)
-- ============================================================
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  phone_number TEXT NOT NULL,
  name TEXT,
  email TEXT,

  -- Metadata extensible
  metadata JSONB DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(tenant_id, phone_number)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_metadata ON users USING GIN (metadata);

-- ============================================================
-- FLOWS
-- ============================================================
CREATE TABLE flows (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  whatsapp_account_id TEXT REFERENCES whatsapp_accounts(id),

  name TEXT NOT NULL,
  description TEXT,

  -- Activación del flujo
  trigger_type TEXT NOT NULL,
  trigger_keywords TEXT[],

  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_flows_tenant ON flows(tenant_id);
CREATE INDEX idx_flows_wa_account ON flows(whatsapp_account_id);
CREATE INDEX idx_flows_trigger_type ON flows(trigger_type);

-- ============================================================
-- FLOW NODES
-- ============================================================
CREATE TABLE flow_nodes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  flow_id TEXT NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  parent_node_id TEXT REFERENCES flow_nodes(id),

  -- Tipo de nodo
  node_type TEXT NOT NULL,

  -- Configuración específica por tipo
  config JSONB NOT NULL,

  -- Editor visual (futuro)
  position JSONB,

  -- Transiciones
  transitions JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flow_nodes_flow ON flow_nodes(flow_id);
CREATE INDEX idx_flow_nodes_parent ON flow_nodes(parent_node_id);
CREATE INDEX idx_flow_nodes_type ON flow_nodes(node_type);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  whatsapp_account_id TEXT NOT NULL REFERENCES whatsapp_accounts(id),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Estado del flujo
  active_flow_id TEXT REFERENCES flows(id),
  current_node_id TEXT REFERENCES flow_nodes(id),

  -- Contexto
  context JSONB DEFAULT '{}'::JSONB,

  -- Ventana de 24h
  session_expires_at TIMESTAMPTZ,

  status TEXT DEFAULT 'active',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_wa_account ON conversations(whatsapp_account_id);

-- Only one active conversation per user
CREATE UNIQUE INDEX idx_conversations_unique_active
  ON conversations(user_id, status)
  WHERE status = 'active' AND deleted_at IS NULL;

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),

  -- WhatsApp IDs
  whatsapp_message_id TEXT UNIQUE,

  -- Dirección
  direction TEXT NOT NULL,

  -- Tipo y contenido
  type TEXT NOT NULL,
  content JSONB NOT NULL,

  -- Estado (solo outbound)
  status TEXT,

  -- Full-text search
  content_text TEXT,

  sent_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, sent_at DESC);
CREATE INDEX idx_messages_tenant ON messages(tenant_id, sent_at DESC);
CREATE INDEX idx_messages_wa_id ON messages(whatsapp_message_id);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_fulltext ON messages USING GIN (to_tsvector('spanish', content_text));

-- ============================================================
-- WEBHOOK LOGS
-- ============================================================
CREATE TABLE webhook_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id TEXT REFERENCES tenants(id),

  method TEXT NOT NULL,
  headers JSONB,
  body JSONB,
  response_status INTEGER,
  error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_tenant ON webhook_logs(tenant_id);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at DESC);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Update updated_at on tenants
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_accounts_updated_at BEFORE UPDATE ON whatsapp_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flows_updated_at BEFORE UPDATE ON flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_nodes_updated_at BEFORE UPDATE ON flow_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- INITIAL DATA (Optional - can be loaded separately)
-- ============================================================

-- No initial data for MVP, will be created via admin UI
