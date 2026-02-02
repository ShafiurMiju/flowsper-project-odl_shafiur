'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Input } from '@/components/ui';
import { ConversationCard, MessageForm, MessageBubble } from '@/components/conversations';
import { GHLConversation, GHLMessage, CreateMessagePayload, GHLContact } from '@/types';
import { RefreshCw, Search, Send, Plus, X } from 'lucide-react';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<GHLConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<GHLConversation | null>(null);
  const [messages, setMessages] = useState<GHLMessage[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageType, setMessageType] = useState<'SMS' | 'Email'>('SMS');
  const [emailSubject, setEmailSubject] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = search
        ? `/api/conversations?query=${encodeURIComponent(search)}&limit=50`
        : '/api/conversations?limit=5';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/contacts?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/conversations/${conversationId}/messages?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      console.log('Messages API response:', data); // Debug log
      
      // GHL API returns: { messages: { messages: [...] } }
      let messagesArray = [];
      if (data.messages && Array.isArray(data.messages.messages)) {
        messagesArray = data.messages.messages;
      } else if (Array.isArray(data.messages)) {
        messagesArray = data.messages;
      } else if (Array.isArray(data)) {
        messagesArray = data;
      }
      
      console.log('Processed messages:', messagesArray); // Debug log
      setMessages(messagesArray);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]); // Set empty array on error
    } finally {
      setMessagesLoading(false);
    }
  };

  const syncConversations = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('access_token');
      await fetch('/api/conversations/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchConversations();
    } catch (error) {
      console.error('Error syncing conversations:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    if (messageType === 'Email' && !emailSubject.trim()) {
      alert('Please enter email subject');
      return;
    }

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('access_token');
      
      const payload: any = {
        type: messageType,
        contactId: selectedConversation.contactId,
        message: newMessage,
      };

      if (messageType === 'Email') {
        payload.subject = emailSubject;
        payload.html = newMessage.replace(/\n/g, '<br>');
      }
      
      const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.details || 'Failed to send message');
      }

      // Success - refresh messages
      await fetchMessages(selectedConversation.id);
      setNewMessage('');
      setEmailSubject('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleNewMessage = async (data: CreateMessagePayload) => {
    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to send message');

    // Refresh conversations
    await fetchConversations();
  };

  const handleConversationClick = (conversation: GHLConversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchConversations();
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (search !== '') {
        fetchConversations();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, fetchConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-[calc(100vh-120px)] flex">
      {/* Conversations List */}
      <div className="w-96 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Messages</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={syncConversations}
                loading={syncing}
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              </Button>
              <Button size="sm" onClick={() => setShowNewMessage(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
              <p className="mt-4 text-gray-500">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">
                {search ? 'No conversations found.' : 'No conversations yet.'}
              </p>
              <Button className="mt-4" onClick={() => setShowNewMessage(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start a conversation
              </Button>
            </div>
          ) : (
            conversations.map((conversation, index) => (
              <ConversationCard
                key={conversation.id || `conversation-${index}`}
                conversation={conversation}
                onClick={handleConversationClick}
                isActive={selectedConversation?.id === conversation.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Messages Panel */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {selectedConversation.contactName ||
                    selectedConversation.fullName ||
                    'Unknown Contact'}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedConversation.phone || selectedConversation.email}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedConversation(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No messages yet</p>
                </div>
              ) : (
                <>
                  {Array.isArray(messages) && messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.direction === 'outbound'}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
              {/* Message Type Selector */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Send via:
                </label>
                <div className="flex gap-2">
                  {selectedConversation.phone && (
                    <button
                      type="button"
                      onClick={() => setMessageType('SMS')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        messageType === 'SMS'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      SMS
                    </button>
                  )}
                  {selectedConversation.email && (
                    <button
                      type="button"
                      onClick={() => setMessageType('Email')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        messageType === 'Email'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      Email
                    </button>
                  )}
                </div>
              </div>

              {/* Email Subject */}
              {messageType === 'Email' && (
                <div className="mb-3">
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={3}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  loading={sendingMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600">
                Choose a conversation from the list to view messages
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Message Form */}
      <MessageForm
        isOpen={showNewMessage}
        onClose={() => setShowNewMessage(false)}
        onSubmit={handleNewMessage}
        contacts={contacts}
      />
    </div>
  );
}
