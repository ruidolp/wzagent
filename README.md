# WIRC - WhatsApp Integration & Response Center

Multi-tenant WhatsApp Business management system with modular flow-based conversation handling.

## Features

- ✅ Multi-tenant architecture (single database, multiple companies)
- ✅ WhatsApp Cloud API integration
- ✅ Webhook handling for incoming messages
- ✅ Modular handler system (text, interactive menus, data capture)
- ✅ Flow-based conversation management
- ✅ User differentiation (new vs. known users)
- ✅ Full message history with search
- ✅ Admin interface for tenant management

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL 14+
- **ORM**: Kysely
- **Language**: TypeScript
- **Styling**: TailwindCSS

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/wirc
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENABLE_WEBHOOK_LOGGING=true
ENABLE_DEBUG_LOGS=true
```

### 3. Setup Database

Run the initial migration:

```bash
npm run db:migrate
```

Generate TypeScript types:

```bash
npm run db:types
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Creating Your First Tenant

1. Go to [http://localhost:3000/admin/tenants](http://localhost:3000/admin/tenants)
2. Click "Create Tenant"
3. Fill in the form with your WhatsApp Business details:
   - **Tenant Name**: Your company name
   - **Phone Number**: WhatsApp Business number (e.g., +56912345678)
   - **Phone Number ID**: Get from Meta Developer Console
   - **Business Account ID (WABA)**: Get from Meta Developer Console
   - **Access Token**: Your WhatsApp API access token
4. Copy the generated **Webhook URL** and **Verify Token**
5. Configure webhook in Meta Developer Console

## Seeding Initial Flows

After creating a tenant, seed the initial flows:

1. Get your tenant ID from the admin interface
2. Edit `src/infrastructure/database/migrations/002_seed_initial_flows.sql`
3. Replace `{TENANT_ID}` with your actual tenant ID
4. Run the migration:

```bash
psql $DATABASE_URL -f src/infrastructure/database/migrations/002_seed_initial_flows.sql
```

This creates two flows:
- **Welcome New User**: Captures name and email, then shows menu
- **Welcome Known User**: Directly shows menu for returning users

## Project Structure

```
wirc/
├── src/
│   ├── domain/                    # Business entities and types
│   │   └── types/
│   │       ├── whatsapp.types.ts
│   │       └── message-payload.ts
│   │
│   ├── application/               # Business logic
│   │   ├── services/
│   │   │   ├── user.service.ts
│   │   │   ├── conversation.service.ts
│   │   │   └── flow-execution.service.ts
│   │   └── handlers/              # Modular handlers
│   │       ├── base-handler.ts
│   │       ├── text-handler.ts
│   │       ├── menu-handler.ts
│   │       ├── capture-data-handler.ts
│   │       └── registry.ts
│   │
│   ├── infrastructure/            # Technical implementations
│   │   ├── database/
│   │   │   ├── kysely.ts
│   │   │   ├── types.ts
│   │   │   ├── migrations/
│   │   │   └── queries/
│   │   ├── whatsapp/
│   │   │   ├── meta-client.ts
│   │   │   ├── webhook-handler.ts
│   │   │   └── webhook-validator.ts
│   │   ├── messaging/
│   │   │   └── message-sender.ts
│   │   └── utils/
│   │
│   └── app/                       # Next.js routes
│       ├── api/
│       │   ├── webhooks/whatsapp/[tenantId]/
│       │   └── admin/tenants/
│       └── admin/tenants/
│
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

### Handler System

The system uses a modular handler architecture. Each node type has a dedicated handler:

- **TextHandler**: Sends text messages with variable replacement
- **MenuHandler**: Creates interactive WhatsApp menus
- **CaptureDataHandler**: Captures and validates user input

To add a new handler:

1. Create `src/application/handlers/your-handler.ts`
2. Extend `BaseHandler`
3. Register in `registry.ts`

Example:

```typescript
export class AIHandler extends BaseHandler {
  type = 'ai_response'

  async execute(context: HandlerContext): Promise<HandlerResult> {
    // Your AI logic here
  }
}

// In registry.ts
handlerRegistry.register(new AIHandler())
```

### Message Flow

1. WhatsApp sends message → Webhook endpoint
2. Webhook validates signature and logs request
3. System identifies tenant and WhatsApp account
4. User is fetched or created
5. Conversation is retrieved or created
6. Message is saved to database
7. Flow is determined (new_user, known_user, or default)
8. Flow execution begins:
   - Fetch current node
   - Execute node's handler
   - Handler sends messages and returns next node
   - Update conversation state
   - Repeat until no next node (waiting for response)

## Database Schema

### Key Tables

- **tenants**: Companies using the system
- **whatsapp_accounts**: WhatsApp Business numbers
- **users**: End users (WhatsApp contacts)
- **flows**: Conversation flows
- **flow_nodes**: Individual steps in flows
- **conversations**: Active user sessions
- **messages**: Complete message history
- **webhook_logs**: Debug logs

## API Endpoints

### Webhooks

- `GET /api/webhooks/whatsapp/[tenantId]` - Webhook verification
- `POST /api/webhooks/whatsapp/[tenantId]` - Receive messages

### Admin

- `GET /api/admin/tenants` - List tenants
- `POST /api/admin/tenants` - Create tenant

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `NEXT_PUBLIC_APP_URL` | Public app URL | http://localhost:3000 |
| `ENABLE_WEBHOOK_LOGGING` | Log all webhook requests | true |
| `ENABLE_DEBUG_LOGS` | Enable debug logging | true |

## Testing

### Test Webhook Verification

```bash
curl "http://localhost:3000/api/webhooks/whatsapp/{tenantId}?hub.mode=subscribe&hub.verify_token={token}&hub.challenge=test123"
```

Should return: `test123`

### Test Message Reception

Send a message from WhatsApp to your configured number. Check the logs for processing.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy
5. Update webhook URL in Meta Developer Console

### Database

Use a managed PostgreSQL service:
- Vercel Postgres
- Supabase
- Railway
- Neon

## Next Steps

- [ ] Add authentication for admin interface
- [ ] Create visual flow editor
- [ ] Integrate AI responses
- [ ] Add A/B testing for flows
- [ ] Implement analytics dashboard
- [ ] Add template message support
- [ ] Multi-language support
- [ ] Rate limiting
- [ ] Queue system (BullMQ)

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
