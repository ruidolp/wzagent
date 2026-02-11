'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewTenantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    phoneNumber: '',
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tenant')
      }

      setSuccess(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData((prev) => ({ ...prev, slug }))
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Tenant created successfully!</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Webhook Configuration</h3>
              <p className="text-sm text-gray-600 mb-2">
                Configure this webhook in your Meta Developer Console:
              </p>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                {success.webhookUrl}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Verify Token</h3>
              <p className="text-sm text-gray-600 mb-2">
                Use this token when setting up the webhook:
              </p>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                {success.verifyToken}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Tenant ID</h3>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                {success.tenant.id}
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/admin/tenants"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block"
              >
                Back to Tenants
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/admin/tenants" className="text-blue-500 hover:text-blue-700 mr-4">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold">Create New Tenant</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tenant Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Company"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="my-company"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used in URLs. Auto-generated from name.
            </p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">WhatsApp Account Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+56912345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number ID (Meta) *
                </label>
                <input
                  type="text"
                  name="phoneNumberId"
                  value={formData.phoneNumberId}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123456789012345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Account ID (WABA) *
                </label>
                <input
                  type="text"
                  name="businessAccountId"
                  value={formData.businessAccountId}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123456789012345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token *
                </label>
                <input
                  type="password"
                  name="accessToken"
                  value={formData.accessToken}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="EAAxxxxxxxxxxxx"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
