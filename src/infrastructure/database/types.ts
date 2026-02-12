import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [K in string]?: JsonValue;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Conversations {
  active_flow_id: string | null;
  context: Generated<Json | null>;
  created_at: Generated<Timestamp | null>;
  current_node_id: string | null;
  deleted_at: Timestamp | null;
  id: Generated<string>;
  session_expires_at: Timestamp | null;
  status: Generated<string | null>;
  tenant_id: string;
  updated_at: Generated<Timestamp | null>;
  user_id: string;
  whatsapp_account_id: string;
}

export interface FlowNodes {
  config: Json;
  created_at: Generated<Timestamp | null>;
  flow_id: string;
  id: Generated<string>;
  node_type: string;
  parent_node_id: string | null;
  position: Json | null;
  transitions: Json | null;
  updated_at: Generated<Timestamp | null>;
}

export interface Flows {
  created_at: Generated<Timestamp | null>;
  deleted_at: Timestamp | null;
  description: string | null;
  id: Generated<string>;
  is_active: Generated<boolean | null>;
  is_default: Generated<boolean | null>;
  name: string;
  tenant_id: string;
  trigger_keywords: string[] | null;
  trigger_type: string;
  updated_at: Generated<Timestamp | null>;
  whatsapp_account_id: string | null;
}

export interface Messages {
  content: Json;
  content_text: string | null;
  conversation_id: string;
  deleted_at: Timestamp | null;
  direction: string;
  id: Generated<string>;
  sent_at: Generated<Timestamp | null>;
  status: string | null;
  tenant_id: string;
  type: string;
  whatsapp_message_id: string | null;
}

export interface Tenants {
  created_at: Generated<Timestamp | null>;
  default_flow_id: string | null;
  deleted_at: Timestamp | null;
  id: Generated<string>;
  known_user_flow_id: string | null;
  name: string;
  new_user_flow_id: string | null;
  session_timeout_minutes: Generated<number | null>;
  slug: string;
  timezone: Generated<string | null>;
  updated_at: Generated<Timestamp | null>;
  welcome_message_known: string | null;
  welcome_message_new: string | null;
}

export interface Users {
  created_at: Generated<Timestamp | null>;
  deleted_at: Timestamp | null;
  email: string | null;
  id: Generated<string>;
  metadata: Generated<Json | null>;
  name: string | null;
  phone_number: string;
  tenant_id: string;
  updated_at: Generated<Timestamp | null>;
}

export interface WebhookLogs {
  body: Json | null;
  created_at: Generated<Timestamp | null>;
  error: string | null;
  headers: Json | null;
  id: Generated<string>;
  method: string;
  response_status: number | null;
  tenant_id: string | null;
}

export interface WhatsappAccounts {
  access_token: string;
  business_account_id: string;
  created_at: Generated<Timestamp | null>;
  deleted_at: Timestamp | null;
  id: Generated<string>;
  phone_number: string;
  phone_number_id: string;
  status: Generated<string | null>;
  tenant_id: string;
  updated_at: Generated<Timestamp | null>;
  webhook_verify_token: string;
}

export interface DB {
  conversations: Conversations;
  flow_nodes: FlowNodes;
  flows: Flows;
  messages: Messages;
  tenants: Tenants;
  users: Users;
  webhook_logs: WebhookLogs;
  whatsapp_accounts: WhatsappAccounts;
}

export type Database = DB;
