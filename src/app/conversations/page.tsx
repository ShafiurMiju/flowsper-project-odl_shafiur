'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Input } from '@/components/ui';
import { ConversationCard, MessageForm, MessageBubble } from '@/components/conversations';
import { GHLConversation, GHLMessage, CreateMessagePayload, GHLContact } from '@/types';
import { RefreshCw, Search, Send, Plus, X, MessageCircle, MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="h-[calc(100vh-120px)] flex rounded-xl border border-border/50 overflow-hidden shadow-sm bg-background">
      {/* Conversations List */}
      <div className="w-96 border-r border-border/50 flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <MessagesSquare className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Messages</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={syncConversations}
                disabled={syncing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
              </Button>
              <Button 
                size="sm" 
                onClick={() => setShowNewMessage(true)}
                className="h-8 w-8 p-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
              <RefreshCw className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
              <p className="mt-4 text-muted-foreground">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {search ? 'No results' : 'No conversations'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {search ? 'Try a different search.' : 'Start a new conversation.'}
              </p>
              <Button 
                onClick={() => setShowNewMessage(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
              >
                <Plus className="w-4 h-4" />
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
      <div className="flex-1 flex flex-col bg-background">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedConversation.contactName ||
                    selectedConversation.fullName ||
                    'Unknown Contact'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.phone || selectedConversation.email}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedConversation(null)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No messages yet</p>
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
            <div className="p-4 border-t border-border/50 bg-card">
              {/* Message Type Selector */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Send via:
                </label>
                <div className="flex gap-2">
                  {selectedConversation.phone && (
                    <button
                      type="button"
                      onClick={() => setMessageType('SMS')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        messageType === 'SMS'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      SMS
                    </button>
                  )}
                  {selectedConversation.email && (
                    <button
                      type="button"
                      onClick={() => setMessageType('Email')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        messageType === 'Email'
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
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
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {sendingMessage ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <MessagesSquare className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Select a conversation
              </h3>
              <p className="text-muted-foreground">
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
