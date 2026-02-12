'use client'

import { useEffect, useState, useRef } from 'react'

interface Tenant {
  id: string
  name: string
  slug: string
}

interface ConversationListItem {
  conversation_id: string
  status: string | null
  phone_number: string
  user_name: string | null
  content_text: string | null
  last_message_at: string | null
  direction: string | null
}

interface Message {
  id: string
  conversation_id: string
  direction: string
  type: string
  content_text: string | null
  sent_at: string
}

interface ConversationDetails {
  conversation_id: string
  user_phone: string
  user_name: string | null
  whatsapp_account_id: string
}

export default function ChatsPage() {
  // State management
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null)
  const [messageInput, setMessageInput] = useState('')

  // Loading states
  const [loadingTenants, setLoadingTenants] = useState(true)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isFetchingConversationsRef = useRef(false)
  const isFetchingMessagesRef = useRef(false)

  // Fetch tenants on mount
  useEffect(() => {
    fetchTenants()
  }, [])

  // Fetch conversations when tenant changes
  useEffect(() => {
    if (selectedTenantId) {
      fetchConversations()
    }
  }, [selectedTenantId])

  // Auto-refresh conversations every 1 second
  useEffect(() => {
    if (!selectedTenantId) return

    const interval = setInterval(() => {
      fetchConversations({ silent: true })
    }, 1000)

    return () => clearInterval(interval)
  }, [selectedTenantId])

  // Auto-refresh selected conversation messages every 1 second
  useEffect(() => {
    if (!selectedConversationId) return

    const interval = setInterval(() => {
      fetchMessages(selectedConversationId, { silent: true })
    }, 1000)

    return () => clearInterval(interval)
  }, [selectedConversationId])

  // Auto-scroll to latest message
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchTenants = async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/tenants')
      if (!response.ok) throw new Error('Failed to fetch tenants')
      const data = await response.json()
      setTenants(data.tenants)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingTenants(false)
    }
  }

  const fetchConversations = async (options?: { silent?: boolean }) => {
    if (!selectedTenantId) return
    if (isFetchingConversationsRef.current) return

    try {
      isFetchingConversationsRef.current = true
      if (!options?.silent) {
        setError(null)
      }
      if (!options?.silent) {
        setLoadingConversations(true)
      }
      const response = await fetch(
        `/api/admin/chats/conversations?tenantId=${selectedTenantId}`
      )
      if (!response.ok) throw new Error('Failed to fetch conversations')
      const data = await response.json()
      setConversations(data.conversations)
    } catch (err) {
      if (!options?.silent) {
        setError((err as Error).message)
      }
    } finally {
      if (!options?.silent) {
        setLoadingConversations(false)
      }
      isFetchingConversationsRef.current = false
    }
  }

  const fetchMessages = async (
    conversationId: string,
    options?: { silent?: boolean }
  ) => {
    if (isFetchingMessagesRef.current) return

    try {
      isFetchingMessagesRef.current = true
      if (!options?.silent) {
        setError(null)
      }
      if (!options?.silent) {
        setLoadingMessages(true)
      }
      const response = await fetch(
        `/api/admin/chats/messages/${conversationId}`
      )
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()
      setMessages(data.messages)
      setConversationDetails(data.conversation)
    } catch (err) {
      if (!options?.silent) {
        setError((err as Error).message)
      }
    } finally {
      if (!options?.silent) {
        setLoadingMessages(false)
      }
      isFetchingMessagesRef.current = false
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    fetchMessages(conversationId)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageInput.trim() || !selectedConversationId || sendingMessage) {
      return
    }

    const messageToSend = messageInput.trim()

    try {
      setError(null)
      setSendingMessage(true)

      const response = await fetch('/api/admin/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          message: messageToSend,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message')
      }

      // Clear input on success
      setMessageInput('')

      // Refresh messages to show the sent message
      await fetchMessages(selectedConversationId)

      // Refresh conversations to update last message
      await fetchConversations()
    } catch (err) {
      setError((err as Error).message)
      // Keep message in input on failure
    } finally {
      setSendingMessage(false)
    }
  }

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId)
    setSelectedConversationId(null)
    setMessages([])
    setConversationDetails(null)
    setConversations([])
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  if (loadingTenants) {
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Chat Interface</h1>

          <div className="flex gap-4 items-center">
            {/* Tenant Dropdown */}
            <select
              value={selectedTenantId || ''}
              onChange={(e) => handleTenantChange(e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            {selectedTenantId && (
              <button
                onClick={() => fetchConversations()}
                disabled={loadingConversations}
                className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loadingConversations ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Chat Layout */}
        {selectedTenantId ? (
          <div className="bg-white shadow rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
            <div className="flex h-full">
              {/* Left Sidebar - Conversations List */}
              <div className="w-1/3 border-r flex flex-col">
                <div className="bg-gray-100 px-4 py-3 font-semibold border-b">
                  Conversations
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadingConversations ? (
                    <div className="p-4 text-gray-500">Loading conversations...</div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p>No conversations yet</p>
                      <p className="text-sm mt-2">
                        Conversations will appear here when users send messages
                      </p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.conversation_id}
                        onClick={() => handleSelectConversation(conv.conversation_id)}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedConversationId === conv.conversation_id
                            ? 'bg-blue-50 border-l-4 border-l-blue-500'
                            : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          {conv.user_name || conv.phone_number}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {conv.direction === 'inbound' && '← '}
                          {conv.direction === 'outbound' && '→ '}
                          {conv.content_text || 'No messages'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatTime(conv.last_message_at)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Panel - Messages */}
              <div className="flex-1 flex flex-col">
                {selectedConversationId ? (
                  <>
                    {/* Chat Header */}
                    <div className="bg-gray-100 px-6 py-4 border-b">
                      <div className="font-semibold text-gray-900">
                        {conversationDetails?.user_name || conversationDetails?.user_phone || 'User'}
                      </div>
                      {conversationDetails?.user_phone && (
                        <div className="text-sm text-gray-500">
                          {conversationDetails.user_phone}
                        </div>
                      )}
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                      {loadingMessages ? (
                        <div className="text-center text-gray-500">
                          Loading messages...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500">
                          No messages yet
                        </div>
                      ) : (
                        <>
                          {messages.map((message) => {
                            const isInbound = message.direction === 'inbound'
                            return (
                              <div
                                key={message.id}
                                className={`flex mb-4 ${
                                  isInbound ? 'justify-start' : 'justify-end'
                                }`}
                              >
                                <div
                                  className={`px-4 py-2 rounded-lg max-w-md ${
                                    isInbound
                                      ? 'bg-white text-gray-900 shadow'
                                      : 'bg-blue-500 text-white'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap break-words">
                                    {message.content_text || '[No text content]'}
                                  </p>
                                  <p
                                    className={`text-xs mt-1 ${
                                      isInbound ? 'text-gray-400' : 'text-blue-100'
                                    }`}
                                  >
                                    {formatTime(message.sent_at)}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>

                    {/* Send Form */}
                    <form
                      onSubmit={handleSendMessage}
                      className="p-4 border-t bg-white"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Type a message..."
                          maxLength={4096}
                          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={sendingMessage}
                        />
                        <button
                          type="submit"
                          disabled={!messageInput.trim() || sendingMessage}
                          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendingMessage ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {messageInput.length}/4096 characters
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <p className="text-lg mb-2">Select a conversation</p>
                      <p className="text-sm">
                        Choose a conversation from the list to view messages
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg mb-2">No tenant selected</p>
            <p className="text-sm text-gray-400">
              Please select a tenant from the dropdown above to view conversations
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
