-- Seed Initial Flows
-- This will create hardcoded flows for testing
-- This migration will also create the default tenant if it doesn't exist

-- ============================================================
-- CREATE DEFAULT TENANT (if not exists)
-- ============================================================
INSERT INTO tenants (id, name, slug, session_timeout_minutes, timezone)
VALUES (
  '26a5c927-7cc9-4bbc-b1a3-963fa4698881',
  'Default Company',
  'default-company',
  30,
  'America/Santiago'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FLOW: Welcome New User
-- ============================================================
DO $$
DECLARE
  tenant_id_var TEXT := '26a5c927-7cc9-4bbc-b1a3-963fa4698881'; -- Default Company tenant
  flow_new_user_id TEXT;
  node_welcome_id TEXT;
  node_capture_name_id TEXT;
  node_capture_email_id TEXT;
  node_thanks_id TEXT;
  node_main_menu_id TEXT;
  node_info_id TEXT;
  node_support_id TEXT;
  node_sales_id TEXT;
BEGIN
  -- Create flow for new users
  INSERT INTO flows (tenant_id, name, description, trigger_type, is_active, is_default)
  VALUES (tenant_id_var, 'Welcome New User', 'Onboarding flow for new users', 'new_user', true, false)
  RETURNING id INTO flow_new_user_id;

  -- Node 1: Welcome message
  INSERT INTO flow_nodes (flow_id, node_type, config)
  VALUES (
    flow_new_user_id,
    'text',
    jsonb_build_object(
      'text', '¡Hola! Bienvenido 👋 Por favor, dime tu nombre.'
    )
  )
  RETURNING id INTO node_welcome_id;

  -- Node 2: Capture name
  INSERT INTO flow_nodes (flow_id, parent_node_id, node_type, config)
  VALUES (
    flow_new_user_id,
    node_welcome_id,
    'capture_data',
    jsonb_build_object(
      'field', 'name',
      'prompt', 'Por favor, dime tu nombre.',
      'validation', 'none',
      'saveToUser', true
    )
  )
  RETURNING id INTO node_capture_name_id;

  -- Node 3: Capture email
  INSERT INTO flow_nodes (flow_id, parent_node_id, node_type, config)
  VALUES (
    flow_new_user_id,
    node_capture_name_id,
    'capture_data',
    jsonb_build_object(
      'field', 'email',
      'prompt', '¿Cuál es tu email?',
      'validation', 'email',
      'saveToUser', true
    )
  )
  RETURNING id INTO node_capture_email_id;

  -- Node 4: Thanks message
  INSERT INTO flow_nodes (flow_id, parent_node_id, node_type, config)
  VALUES (
    flow_new_user_id,
    node_capture_email_id,
    'text',
    jsonb_build_object(
      'text', '¡Gracias {nombre}! Ya estás registrado 🎉'
    )
  )
  RETURNING id INTO node_thanks_id;

  -- Node 5: Main menu
  INSERT INTO flow_nodes (flow_id, parent_node_id, node_type, config)
  VALUES (
    flow_new_user_id,
    node_thanks_id,
    'menu',
    jsonb_build_object(
      'header', 'Menú Principal',
      'body', '¿Qué necesitas?',
      'buttonText', 'Ver opciones',
      'options', jsonb_build_array(
        jsonb_build_object('id', 'info', 'title', 'Información', 'description', 'Más sobre nosotros', 'nextNodeId', 'TO_BE_SET'),
        jsonb_build_object('id', 'support', 'title', 'Soporte', 'description', 'Ayuda y soporte', 'nextNodeId', 'TO_BE_SET'),
        jsonb_build_object('id', 'sales', 'title', 'Ventas', 'description', 'Consultas comerciales', 'nextNodeId', 'TO_BE_SET')
      )
    )
  )
  RETURNING id INTO node_main_menu_id;

  -- Terminal nodes for menu options
  INSERT INTO flow_nodes (flow_id, parent_node_id, node_type, config)
  VALUES (
    flow_new_user_id,
    node_main_menu_id,
    'text',
    jsonb_build_object('text', 'Aquí encontrarás información sobre nuestra empresa. Escribe MENU para volver.')
  )
  RETURNING id INTO node_info_id;

  INSERT INTO flow_nodes (flow_id, parent_node_id, node_type, config)
  VALUES (
    flow_new_user_id,
    node_main_menu_id,
    'text',
    jsonb_build_object('text', 'Nuestro equipo de soporte te ayudará. Escribe MENU para volver.')
  )
  RETURNING id INTO node_support_id;

  INSERT INTO flow_nodes (flow_id, parent_node_id, node_type, config)
  VALUES (
    flow_new_user_id,
    node_main_menu_id,
    'text',
    jsonb_build_object('text', 'Consultas de ventas. Escribe MENU para volver.')
  )
  RETURNING id INTO node_sales_id;

  -- Update transitions in welcome node
  UPDATE flow_nodes SET config = config || jsonb_build_object('nextNodeId', node_capture_name_id)
  WHERE id = node_welcome_id;

  -- Update transitions in capture name
  UPDATE flow_nodes SET config = config || jsonb_build_object('nextNodeId', node_capture_email_id)
  WHERE id = node_capture_name_id;

  -- Update transitions in capture email
  UPDATE flow_nodes SET config = config || jsonb_build_object('nextNodeId', node_thanks_id)
  WHERE id = node_capture_email_id;

  -- Update transitions in thanks
  UPDATE flow_nodes SET config = config || jsonb_build_object('nextNodeId', node_main_menu_id)
  WHERE id = node_thanks_id;

  -- Update menu options with actual node IDs
  UPDATE flow_nodes
  SET config = jsonb_set(
    jsonb_set(
      jsonb_set(
        config,
        '{options,0,nextNodeId}',
        to_jsonb(node_info_id)
      ),
      '{options,1,nextNodeId}',
      to_jsonb(node_support_id)
    ),
    '{options,2,nextNodeId}',
    to_jsonb(node_sales_id)
  )
  WHERE id = node_main_menu_id;

  RAISE NOTICE 'Created flow: Welcome New User (%)' , flow_new_user_id;

  -- ============================================================
  -- FLOW: Welcome Known User
  -- ============================================================
  DECLARE
    flow_known_user_id TEXT;
    node_welcome_known_id TEXT;
    node_menu_known_id TEXT;
  BEGIN
    -- Create flow for known users
    INSERT INTO flows (tenant_id, name, description, trigger_type, is_active, is_default)
    VALUES (tenant_id_var, 'Welcome Known User', 'Welcome back message for returning users', 'known_user', true, true)
    RETURNING id INTO flow_known_user_id;

    -- Node 1: Welcome message
    INSERT INTO flow_nodes (flow_id, node_type, config)
    VALUES (
      flow_known_user_id,
      'text',
      jsonb_build_object(
        'text', '¡Hola {nombre}! Bienvenido de nuevo 👋'
      )
    )
    RETURNING id INTO node_welcome_known_id;

    -- Node 2: Main menu (reuse same structure)
    INSERT INTO flow_nodes (flow_id, parent_node_id, node_type, config)
    VALUES (
      flow_known_user_id,
      node_welcome_known_id,
      'menu',
      jsonb_build_object(
        'header', 'Menú Principal',
        'body', '¿Qué necesitas?',
        'buttonText', 'Ver opciones',
        'options', jsonb_build_array(
          jsonb_build_object('id', 'info', 'title', 'Información', 'description', 'Más sobre nosotros', 'nextNodeId', node_info_id),
          jsonb_build_object('id', 'support', 'title', 'Soporte', 'description', 'Ayuda y soporte', 'nextNodeId', node_support_id),
          jsonb_build_object('id', 'sales', 'title', 'Ventas', 'description', 'Consultas comerciales', 'nextNodeId', node_sales_id)
        )
      )
    )
    RETURNING id INTO node_menu_known_id;

    -- Update welcome node transition
    UPDATE flow_nodes SET config = config || jsonb_build_object('nextNodeId', node_menu_known_id)
    WHERE id = node_welcome_known_id;

    RAISE NOTICE 'Created flow: Welcome Known User (%)' , flow_known_user_id;
  END;
END $$;
