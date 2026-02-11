// Load environment variables FIRST before any imports
import * as dotenv from 'dotenv'
import * as path from 'path'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'

/**
 * Script to diagnose WhatsApp configuration issues
 * Run with: npm run check:whatsapp
 */

const envPath = path.resolve(process.cwd(), '.env')
dotenv.config({ path: envPath })

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file!')
  console.error('   Make sure your .env file contains: DATABASE_URL=...')
  process.exit(1)
}

async function checkConfig() {
  console.log('🔍 ===============================================')
  console.log('🔍 WhatsApp Configuration Diagnostic')
  console.log('🔍 ===============================================\n')

  try {
    // Create database connection directly
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    })

    const db = new Kysely<any>({
      dialect: new PostgresDialect({ pool }),
    })

    // Check tenants
    console.log('📋 Checking Tenants...')
    const tenants = await db
      .selectFrom('tenants')
      .selectAll()
      .where('deleted_at', 'is', null)
      .execute()

    if (tenants.length === 0) {
      console.log('❌ No tenants found!')
      return
    }

    console.log(`✅ Found ${tenants.length} tenant(s)\n`)

    // Check each tenant's WhatsApp accounts
    for (const tenant of tenants) {
      console.log(`\n🏢 Tenant: ${tenant.name} (${tenant.slug})`)
      console.log(`   ID: ${tenant.id}`)
      console.log(`   Webhook URL: ${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp/${tenant.id}`)

      const accounts = await db
        .selectFrom('whatsapp_accounts')
        .selectAll()
        .where('tenant_id', '=', tenant.id)
        .where('deleted_at', 'is', null)
        .execute()

      if (accounts.length === 0) {
        console.log('   ❌ No WhatsApp accounts configured!')
        continue
      }

      for (const account of accounts) {
        console.log(`\n   📱 WhatsApp Account:`)
        console.log(`      Phone: ${account.phone_number}`)
        console.log(`      Phone Number ID: ${account.phone_number_id}`)
        console.log(`      Business Account ID: ${account.business_account_id}`)
        console.log(`      Verify Token: ${account.webhook_verify_token}`)

        // Check access token
        const tokenLength = account.access_token?.length || 0
        if (tokenLength === 0) {
          console.log(`      ❌ Access Token: MISSING!`)
        } else if (tokenLength < 100) {
          console.log(`      ⚠️  Access Token: Too short (${tokenLength} chars) - may be invalid`)
        } else {
          console.log(`      ✅ Access Token: Present (${tokenLength} chars)`)
          console.log(`         Starts with: ${account.access_token.substring(0, 15)}...`)
        }

        // Test the token by calling Meta API
        console.log(`\n      🧪 Testing Access Token...`)
        try {
          const response = await fetch(
            `https://graph.facebook.com/v21.0/${account.phone_number_id}`,
            {
              headers: {
                Authorization: `Bearer ${account.access_token}`,
              },
            }
          )

          if (response.ok) {
            const data = await response.json()
            console.log(`      ✅ Token is VALID!`)
            console.log(`         Phone Number: ${data.display_phone_number || 'N/A'}`)
            console.log(`         Quality Rating: ${data.quality_rating || 'N/A'}`)
            console.log(`         Verified Name: ${data.verified_name || 'N/A'}`)
          } else {
            const error = await response.json()
            console.log(`      ❌ Token is INVALID or has wrong permissions!`)
            console.log(`         Error: ${error.error?.message || 'Unknown error'}`)
            console.log(`         Code: ${error.error?.code || 'N/A'}`)
            console.log(`         Type: ${error.error?.type || 'N/A'}`)

            if (error.error?.code === 190) {
              console.log(`\n         💡 Solution: Token expired! Generate a new token from Meta Business Suite`)
            } else if (error.error?.code === 10) {
              console.log(`\n         💡 Solution: Missing permissions! Generate token with these scopes:`)
              console.log(`            - whatsapp_business_messaging`)
              console.log(`            - whatsapp_business_management`)
            }
          }
        } catch (err) {
          console.log(`      ❌ Error testing token: ${(err as Error).message}`)
        }

        // Check recent messages
        console.log(`\n      📊 Checking Recent Activity...`)
        const recentMessages = await db
          .selectFrom('messages')
          .select(['id', 'direction', 'status', 'created_at'])
          .where('whatsapp_account_id', '=', account.id)
          .orderBy('created_at', 'desc')
          .limit(5)
          .execute()

        if (recentMessages.length === 0) {
          console.log(`      ℹ️  No messages found`)
        } else {
          console.log(`      ✅ Found ${recentMessages.length} recent message(s):`)
          recentMessages.forEach((msg, idx) => {
            console.log(`         ${idx + 1}. ${msg.direction} - ${msg.status} (${new Date(msg.created_at).toLocaleString()})`)
          })
        }

        // Check webhook logs
        const recentWebhooks = await db
          .selectFrom('webhook_logs')
          .select(['id', 'response_status', 'error', 'created_at'])
          .where('tenant_id', '=', tenant.id)
          .orderBy('created_at', 'desc')
          .limit(5)
          .execute()

        if (recentWebhooks.length === 0) {
          console.log(`\n      ⚠️  No webhook logs found - Meta may not be sending webhooks`)
          console.log(`         Check your webhook configuration in Meta Business Suite`)
        } else {
          console.log(`\n      ✅ Found ${recentWebhooks.length} recent webhook(s):`)
          recentWebhooks.forEach((log, idx) => {
            const status = log.response_status === 200 ? '✅' : '❌'
            const error = log.error ? ` - Error: ${log.error}` : ''
            console.log(`         ${idx + 1}. ${status} Status ${log.response_status}${error} (${new Date(log.created_at).toLocaleString()})`)
          })
        }
      }
    }

    console.log('\n\n🎯 ===============================================')
    console.log('🎯 Recommendations:')
    console.log('🎯 ===============================================\n')

    console.log('1. If token is invalid or expired:')
    console.log('   → Go to http://localhost:3000/admin/tenants')
    console.log('   → Click "Edit" on your tenant')
    console.log('   → Update the Access Token with a fresh one from Meta\n')

    console.log('2. If you see permission errors (code 10):')
    console.log('   → Generate a new token with these permissions:')
    console.log('     • whatsapp_business_messaging')
    console.log('     • whatsapp_business_management\n')

    console.log('3. If no webhooks are arriving:')
    console.log('   → Check webhook configuration in Meta Business Suite')
    console.log('   → Verify the Callback URL and Verify Token')
    console.log('   → Make sure you\'re using ngrok if testing locally\n')

    console.log('4. If you can\'t send to a number (mode development):')
    console.log('   → Add the number to test numbers in Meta Business Suite')
    console.log('   → WhatsApp > API Setup > Phone numbers for testing\n')

    console.log('5. Monitor in real-time:')
    console.log('   → Webhook logs: http://localhost:3000/admin/webhook-logs')
    console.log('   → Server console: Look for 🔔 and 💬 emojis\n')

  } catch (error) {
    console.error('❌ Error during diagnostic:', error)
  } finally {
    process.exit(0)
  }
}

checkConfig()
