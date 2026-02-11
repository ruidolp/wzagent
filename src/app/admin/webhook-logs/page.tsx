'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface WebhookLog {
  id: string
  tenant_id: string
  method: string
  body: any
  response_status: number
  error?: string
  created_at: string
}

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null)

  useEffect(() => {
    fetchLogs()

    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/webhook-logs')
      if (!response.ok) throw new Error('Failed to fetch logs')
      const data = await response.json()
      setLogs(data.logs)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600'
    if (status >= 400 && status < 500) return 'text-yellow-600'
    if (status >= 500) return 'text-red-600'
    return 'text-gray-600'
  }

  const hasMessages = (log: WebhookLog) => {
    return log.body?.entry?.[0]?.changes?.[0]?.value?.messages?.length > 0
  }

  const hasStatuses = (log: WebhookLog) => {
    return log.body?.entry?.[0]?.changes?.[0]?.value?.statuses?.length > 0
  }

  const getMessageType = (log: WebhookLog) => {
    if (hasMessages(log)) return '💬 Message'
    if (hasStatuses(log)) return '📊 Status'
    return '📦 Unknown'
  }

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Webhook Logs</h1>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-refresh (5s)</span>
            </label>
            <button
              onClick={fetchLogs}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Refresh Now
            </button>
            <Link
              href="/admin/tenants"
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Back to Tenants
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {logs.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">No webhook logs found</p>
            <p className="text-sm text-gray-400">
              Logs will appear here when webhooks are received from Meta
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logs List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="font-semibold">Recent Webhooks ({logs.length})</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[calc(100vh-250px)] overflow-y-auto">
                {logs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      selectedLog?.id === log.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.method}
                        </span>
                        <span className={`font-semibold ${getStatusColor(log.response_status)}`}>
                          {log.response_status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {getMessageType(log)}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      Tenant: {log.tenant_id.substring(0, 8)}...
                    </div>
                    {log.error && (
                      <div className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                        ⚠️ {log.error}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Log Details */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="font-semibold">Log Details</h2>
              </div>
              <div className="p-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                {selectedLog ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Timestamp</h3>
                      <p className="text-sm">{new Date(selectedLog.created_at).toLocaleString()}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Tenant ID</h3>
                      <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedLog.tenant_id}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Status</h3>
                      <p className={`text-sm ${getStatusColor(selectedLog.response_status)}`}>
                        {selectedLog.response_status}
                      </p>
                    </div>

                    {selectedLog.error && (
                      <div>
                        <h3 className="text-sm font-semibold text-red-700 mb-2">Error</h3>
                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{selectedLog.error}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Webhook Body</h3>
                      <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
                        {JSON.stringify(selectedLog.body, null, 2)}
                      </pre>
                    </div>

                    {/* Message Details */}
                    {hasMessages(selectedLog) && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">💬 Message Details</h3>
                        <div className="bg-blue-50 p-3 rounded">
                          {selectedLog.body.entry[0].changes[0].value.messages.map((msg: any) => (
                            <div key={msg.id} className="space-y-1">
                              <p className="text-sm"><strong>From:</strong> {msg.from}</p>
                              <p className="text-sm"><strong>Type:</strong> {msg.type}</p>
                              {msg.text && (
                                <p className="text-sm"><strong>Text:</strong> {msg.text.body}</p>
                              )}
                              <p className="text-xs text-gray-500"><strong>ID:</strong> {msg.id}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Details */}
                    {hasStatuses(selectedLog) && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">📊 Status Updates</h3>
                        <div className="bg-green-50 p-3 rounded space-y-2">
                          {selectedLog.body.entry[0].changes[0].value.statuses.map((status: any, idx: number) => (
                            <div key={idx} className="border-b border-green-200 pb-2 last:border-0">
                              <p className="text-sm"><strong>Status:</strong> {status.status}</p>
                              <p className="text-sm"><strong>To:</strong> {status.recipient_id}</p>
                              <p className="text-xs text-gray-500"><strong>Message ID:</strong> {status.id}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Select a log to view details
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
