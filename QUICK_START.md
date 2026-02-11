# WIRC Quick Start Guide

Get WIRC running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- WhatsApp Business Account configured in Meta Developer Console

## Step 1: Database Setup (1 min)

```bash
# Create database
createdb wirc

# Run initial migration
psql wirc -f src/infrastructure/database/migrations/001_initial_schema.sql
```

## Step 2: Environment Configuration (30 seconds)

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/wirc
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENABLE_WEBHOOK_LOGGING=true
ENABLE_DEBUG_LOGS=true
```

## Step 3: Start Development Server (30 seconds)

```bash
npm run dev
```

Open http://localhost:3000 - You should see the WIRC homepage!

## Step 4: Create Your First Tenant (1 min)

1. Go to http://localhost:3000/admin/tenants
2. Click "Create Tenant"
3. Fill in the form:
   - **Tenant Name**: Your Company Name
   - **Phone Number**: +56912345678 (your WhatsApp Business number)
   - **Phone Number ID**: Get from Meta Developer Console
   - **Business Account ID**: Get from Meta Developer Console
   - **Access Token**: Your WhatsApp API token

4. Click "Create Tenant"
5. **Copy the Webhook URL and Verify Token** displayed on success page

## Step 5: Configure Meta Webhook (2 min)

1. Go to Meta Developer Console → Your App → WhatsApp → Configuration
2. Click "Edit" next to Webhook
3. Paste your **Webhook URL** (from Step 4)
4. Paste your **Verify Token** (from Step 4)
5. Click "Verify and Save"
6. Subscribe to webhook fields: `messages`

## Step 6: Seed Initial Flows (30 seconds)

After creating your tenant, you need to seed the initial conversation flows:

1. Get your tenant ID from the success page (or from the database)
2. Edit the seed file:
   ```bash
   # Open the file
   nano src/infrastructure/database/migrations/002_seed_initial_flows.sql

   # Replace {TENANT_ID} with your actual tenant ID
   # Line 9: tenant_id_var TEXT := 'your-actual-tenant-id-here';
   ```

3. Run the seed:
   ```bash
   psql wirc -f src/infrastructure/database/migrations/002_seed_initial_flows.sql
   ```

This creates two flows:
- **Welcome New User**: Onboarding flow that captures name and email
- **Welcome Known User**: Welcome back message for returning users

## Step 7: Test It! (1 min)

Send a message from WhatsApp to your Business number:

1. **First Message**:
   - User: "Hola"
   - Bot: "¡Hola! Bienvenido 👋 Por favor, dime tu nombre."
   - User: "Juan"
   - Bot: "¿Cuál es tu email?"
   - User: "juan@example.com"
   - Bot: "¡Gracias Juan! Ya estás registrado 🎉"
   - Bot: Shows interactive menu

2. **Second Message** (same user):
   - User: "Hola"
   - Bot: "¡Hola Juan! Bienvenido de nuevo 👋"
   - Bot: Shows interactive menu

3. **Menu Navigation**:
   - Click "Ver opciones" in WhatsApp
   - Select any option
   - Bot responds accordingly
   - Type "MENU" to go back to main menu

## Troubleshooting

### Webhook not receiving messages

Check webhook logs:
```sql
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
```

### Flow not executing

Check if flows exist:
```sql
SELECT id, name, trigger_type FROM flows WHERE deleted_at IS NULL;
```

Check if nodes exist:
```sql
SELECT fn.id, fn.node_type, f.name as flow_name
FROM flow_nodes fn
JOIN flows f ON f.id = fn.flow_id;
```

### Database connection error

Verify DATABASE_URL in `.env`:
```bash
psql $DATABASE_URL -c "SELECT 1;"
```

### TypeScript errors

Regenerate types:
```bash
npm run db:types
```

## Verify Everything Works

```bash
# Check database connection
psql wirc -c "SELECT COUNT(*) FROM tenants;"

# Check server is running
curl http://localhost:3000

# Check webhook endpoint
curl "http://localhost:3000/api/webhooks/whatsapp/YOUR_TENANT_ID?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test"
# Should return: test
```

## Development Tips

### View Logs

```bash
# Application logs
npm run dev

# Database logs
tail -f /path/to/postgresql/log

# Webhook logs (in database)
psql wirc -c "SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 5;"
```

### Inspect Messages

```bash
# View all messages
psql wirc -c "SELECT m.direction, m.type, m.content_text, u.name
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
JOIN users u ON u.id = c.user_id
ORDER BY m.sent_at DESC
LIMIT 10;"

# View conversations
psql wirc -c "SELECT c.id, u.name, u.phone_number, c.status, f.name as active_flow
FROM conversations c
JOIN users u ON u.id = c.user_id
LEFT JOIN flows f ON f.id = c.active_flow_id
ORDER BY c.updated_at DESC;"
```

### Reset a User (for testing)

```bash
# Delete user and related data to test new user flow again
psql wirc -c "DELETE FROM users WHERE phone_number = '+56912345678';"
```

## Next Steps

- **Add more flows**: Create custom flows for your use case
- **Customize messages**: Edit flow nodes to match your brand voice
- **Add AI**: Implement AIHandler for intelligent responses
- **Deploy**: Push to Vercel and configure production database
- **Monitor**: Set up logging and analytics

## Common Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Regenerate DB types
npm run db:types

# Run migration
npm run db:migrate
```

## Get Help

- Check README.md for detailed documentation
- Review IMPLEMENTATION_COMPLETE.md for architecture details
- Check code comments for implementation specifics
- Inspect database schema in migrations/001_initial_schema.sql

---

**Ready to go!** 🚀

Send your first WhatsApp message and watch WIRC handle it automatically!
