'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Tenant {
  id: string
  name: string
  slug: string
  created_at: string
  welcome_message_new?: string
  welcome_message_known?: string
  new_user_flow_id?: string
  known_user_flow_id?: string
  session_timeout_minutes?: number
}

interface WhatsAppAccount {
  id: string
  phone_number: string
  phone_number_id: string
  business_account_id: string
  access_token: string
  webhook_verify_token: string
}

interface Flow {
  id: string
  name: string
  description?: string
}

export default function EditTenantPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([])
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [businessAccountId, setBusinessAccountId] = useState('')
  const [welcomeMessageNew, setWelcomeMessageNew] = useState('')
  const [welcomeMessageKnown, setWelcomeMessageKnown] = useState('')
  const [newUserFlowId, setNewUserFlowId] = useState('')
  const [knownUserFlowId, setKnownUserFlowId] = useState('')
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(3)

  useEffect(() => {
    fetchTenant()
  }, [tenantId])

  const fetchTenant = async () => {
    try {
      // Fetch tenant and flows in parallel
      const [tenantResponse, flowsResponse] = await Promise.all([
        fetch(`/api/admin/tenants/${tenantId}`),
        fetch(`/api/admin/flows?tenantId=${tenantId}`)
      ])

      if (!tenantResponse.ok) throw new Error('Failed to fetch tenant')
      if (!flowsResponse.ok) throw new Error('Failed to fetch flows')

      const tenantData = await tenantResponse.json()
      const flowsData = await flowsResponse.json()

      setTenant(tenantData.tenant)
      setAccounts(tenantData.accounts)
      setFlows(flowsData.flows)

      // Set form values
      setName(tenantData.tenant.name)
      setWelcomeMessageNew(tenantData.tenant.welcome_message_new || '')
      setWelcomeMessageKnown(tenantData.tenant.welcome_message_known || '')
      setNewUserFlowId(tenantData.tenant.new_user_flow_id || '')
      setKnownUserFlowId(tenantData.tenant.known_user_flow_id || '')
      setSessionTimeoutMinutes(tenantData.tenant.session_timeout_minutes || 3)

      if (tenantData.accounts.length > 0) {
        const account = tenantData.accounts[0]
        setAccessToken(account.access_token)
        setPhoneNumberId(account.phone_number_id)
        setBusinessAccountId(account.business_account_id)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          accountId: accounts[0]?.id,
          accessToken,
          phoneNumberId,
          businessAccountId,
          welcomeMessageNew,
          welcomeMessageKnown,
          newUserFlowId: newUserFlowId || null,
          knownUserFlowId: knownUserFlowId || null,
          sessionTimeoutMinutes,
        }),
      })

      if (!response.ok) throw new Error('Failed to update tenant')

      setSuccess(true)
      await fetchTenant()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-600">Tenant not found</p>
        </div>
      </div>
    )
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/webhooks/whatsapp/${tenant.id}`

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin/tenants"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Tenants
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-6">Edit Tenant: {tenant.name}</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Tenant updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tenant Info */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Tenant Information</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (read-only)
                </label>
                <input
                  type="text"
                  value={tenant.slug}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant ID (read-only)
                </label>
                <input
                  type="text"
                  value={tenant.id}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono text-sm"
                />
              </div>
            </div>

            {/* WhatsApp Configuration */}
            <div>
              <h2 className="text-xl font-semibold mb-4">WhatsApp Configuration</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (read-only)
                </label>
                <input
                  type="text"
                  value={accounts[0]?.phone_number || 'N/A'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token (WhatsApp API)
                </label>
                <textarea
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  rows={3}
                  placeholder="EAAxxxxx..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  This token expires periodically. Update it from Meta Business Suite.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Account ID
                </label>
                <input
                  type="text"
                  value={businessAccountId}
                  onChange={(e) => setBusinessAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL (read-only)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    disabled
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(webhookUrl)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Configure this URL in Meta Business Suite webhook settings.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook Verify Token (read-only)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={accounts[0]?.webhook_verify_token || 'N/A'}
                    disabled
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(accounts[0]?.webhook_verify_token || '')}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Use this token when verifying your webhook in Meta Business Suite.
                </p>
              </div>
            </div>

            {/* Flow Configuration */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Flow Configuration</h2>
              <p className="text-sm text-gray-600 mb-4">
                Configure welcome messages and flows for new and existing users.
                Use variables like <code className="bg-gray-100 px-1 py-0.5 rounded">{'{nombre}'}</code> and <code className="bg-gray-100 px-1 py-0.5 rounded">{'{phone}'}</code> in your messages.
              </p>

              {/* Session Timeout */}
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-medium mb-3">Session Timeout</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={sessionTimeoutMinutes}
                    onChange={(e) => setSessionTimeoutMinutes(parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    After this time of inactivity, the next message will restart the conversation with a new welcome message. Default: 3 minutes.
                  </p>
                </div>
              </div>

              {/* New Users */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-medium mb-3">New Users (First Contact)</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Welcome Message
                  </label>
                  <textarea
                    value={welcomeMessageNew}
                    onChange={(e) => setWelcomeMessageNew(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="¡Hola! Bienvenido. ¿Cuál es tu nombre?"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Available variables: {'{nombre}'}, {'{phone}'}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flow to Execute
                  </label>
                  <select
                    value={newUserFlowId}
                    onChange={(e) => setNewUserFlowId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">-- Select Flow (Optional) --</option>
                    {flows.map((flow) => (
                      <option key={flow.id} value={flow.id}>
                        {flow.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Optional: Select a flow to execute after sending the welcome message
                  </p>
                </div>
              </div>

              {/* Existing Users */}
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Existing Users (Return Contact)</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Welcome Message
                  </label>
                  <textarea
                    value={welcomeMessageKnown}
                    onChange={(e) => setWelcomeMessageKnown(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="¡Hola {'{nombre}'}! ¿En qué puedo ayudarte hoy?"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Available variables: {'{nombre}'}, {'{phone}'}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flow to Execute
                  </label>
                  <select
                    value={knownUserFlowId}
                    onChange={(e) => setKnownUserFlowId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">-- Select Flow (Optional) --</option>
                    {flows.map((flow) => (
                      <option key={flow.id} value={flow.id}>
                        {flow.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Optional: Select a flow to execute after sending the welcome message
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Link
                href="/admin/tenants"
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Webhook Testing</h2>
          <p className="text-gray-600 mb-4">
            To test if webhooks are arriving, check the console logs. Incoming webhooks will show:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li><code className="bg-gray-100 px-2 py-1 rounded">Webhook POST received</code> - When Meta sends data</li>
            <li><code className="bg-gray-100 px-2 py-1 rounded">Processing incoming message</code> - When processing a message</li>
            <li><code className="bg-gray-100 px-2 py-1 rounded">WEBHOOK RECEIVED from Meta</code> - Detailed webhook info</li>
          </ul>
          <p className="text-sm text-gray-500 mt-4">
            If you don't see these logs when sending a test message, check your webhook configuration in Meta Business Suite.
          </p>
        </div>
      </div>
    </div>
  )
}
