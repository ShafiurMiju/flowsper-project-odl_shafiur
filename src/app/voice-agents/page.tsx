'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardHeader, Input, Modal, PageLoader, SkeletonCard } from '@/components/ui';
import { VoiceAgentCard, VoiceAgentForm, VoiceActionForm, CallLogsView } from '@/components/voice-agents';
import { GHLVoiceAgent, CreateVoiceAgentPayload, GHLVoiceAgentCall, GHLVoiceAction, CreateVoiceActionPayload } from '@/types';
import { Plus, RefreshCw, Search, Phone, Edit2, Trash2, PhoneCall, Settings2, Zap, Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Voice ID to friendly name mapping
const VOICE_NAMES: Record<string, string> = {
  'jessica': 'Jessica - English, American, Female',
  'michael': 'Michael - English, American, Male',
  'sarah': 'Sarah - English, British, Female',
  'james': 'James - English, British, Male',
  'emma': 'Emma - English, Australian, Female',
  'oliver': 'Oliver - English, Australian, Male',
  'maria': 'Maria - Spanish, Female',
  'carlos': 'Carlos - Spanish, Male',
  'sophie': 'Sophie - French, Female',
  'pierre': 'Pierre - French, Male',
};

const getVoiceName = (voiceId: string | undefined): string => {
  if (!voiceId) return '-';
  return VOICE_NAMES[voiceId] || voiceId;
};

export default function VoiceAgentsPage() {
  const [agents, setAgents] = useState<GHLVoiceAgent[]>([]);
  const [calls, setCalls] = useState<GHLVoiceAgentCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<GHLVoiceAgent | null>(null);
  const [editingAgent, setEditingAgent] = useState<GHLVoiceAgent | null>(null);
  const [callPhoneNumber, setCallPhoneNumber] = useState('');
  const [calling, setCalling] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'call-logs' | 'actions' | 'knowledge'>('agents');
  const [showActionForm, setShowActionForm] = useState(false);
  const [editingAction, setEditingAction] = useState<GHLVoiceAction | null>(null);
  const [agentActions, setAgentActions] = useState<GHLVoiceAction[]>([]);
  const [selectedAgentForActions, setSelectedAgentForActions] = useState<GHLVoiceAgent | null>(null);  
  // Knowledge base state
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);
  const [loadingKBs, setLoadingKBs] = useState(false);
  const [showKBForm, setShowKBForm] = useState(false);
  const [editingKB, setEditingKB] = useState<any>(null);
  const [kbFormData, setKBFormData] = useState({ name: '', description: '' });
  const [selectedKB, setSelectedKB] = useState<any>(null); // Currently viewing KB details
  const [kbSubTab, setKbSubTab] = useState<'crawler' | 'faq'>('crawler');
  
  // Crawler state
  const [websiteUrls, setWebsiteUrls] = useState<any[]>([]);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [discoveryUrl, setDiscoveryUrl] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [training, setTraining] = useState(false);
  const [crawlingStatus, setCrawlingStatus] = useState<any>(null);
  const [crawlMode, setCrawlMode] = useState<'exact' | 'path' | 'domain'>('exact');
  const [showCrawlerModal, setShowCrawlerModal] = useState(false);
  
  // FAQ state
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [faqFormData, setFaqFormData] = useState({ question: '', answer: '' });
  
  // Scraped data viewer state
  const [viewingScrapedData, setViewingScrapedData] = useState<any>(null);
  const [showScrapedDataModal, setShowScrapedDataModal] = useState(false);
  const [scrapedTextContent, setScrapedTextContent] = useState<string>('');
  const [loadingScrapedContent, setLoadingScrapedContent] = useState(false);
  
  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/voice-agents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching voice agents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAgentCalls = async (agentId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/voice-agents/${agentId}/calls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCalls(data.calls || []);
    } catch (error) {
      console.error('Error fetching agent calls:', error);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Debug logging for selectedKB
  useEffect(() => {
    console.log('selectedKB:', selectedKB);
  }, [selectedKB]);

  // Sync form data with editingKB when edit mode is opened
  useEffect(() => {
    if (editingKB) {
      console.log('Setting form data for edit:', {
        name: editingKB.name,
        description: editingKB.description || ''
      });
      setKBFormData({
        name: editingKB.name || '',
        description: editingKB.description || ''
      });
    }
  }, [editingKB, showKBForm]);

  const handleCreateAgent = async (data: CreateVoiceAgentPayload) => {
    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/voice-agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to create voice agent');
    toast.success('Voice agent created successfully!');
    await fetchAgents();
  };

  const handleUpdateAgent = async (data: CreateVoiceAgentPayload) => {
    if (!editingAgent) return;

    console.log('🔄 Updating agent with data:', data);
    console.log('🔄 inboundNumber value:', data.inboundNumber);

    const token = localStorage.getItem('access_token');
    const res = await fetch(`/api/voice-agents/${editingAgent.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to update voice agent');
    
    const result = await res.json();
    console.log('✅ Update response:', result);
    
    setEditingAgent(null);
    toast.success('Voice agent updated successfully!');
    await fetchAgents();
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this voice agent?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/voice-agents/${agentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete voice agent');
      toast.success('Voice agent deleted successfully!');
      await fetchAgents();
    } catch (error) {
      console.error('Error deleting voice agent:', error);
      toast.error('Failed to delete voice agent');
    }
  };

  const handleEditAgent = (agent: GHLVoiceAgent) => {
    setEditingAgent(agent);
  };

  const handleCallAgent = (agent: GHLVoiceAgent) => {
    setSelectedAgent(agent);
    setShowCallModal(true);
    setCallPhoneNumber('');
  };

  const handleMakeCall = async () => {
    if (!selectedAgent || !callPhoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    setCalling(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/voice-agents/${selectedAgent.id}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber: callPhoneNumber }),
      });

      if (!res.ok) throw new Error('Failed to initiate call');
      
      alert('Call initiated successfully!');
      setShowCallModal(false);
      setCallPhoneNumber('');
      await fetchAgentCalls(selectedAgent.id);
    } catch (error) {
      console.error('Error making call:', error);
      alert('Failed to initiate call');
    } finally {
      setCalling(false);
    }
  };

  // Action management functions
  const handleManageActions = (agent: GHLVoiceAgent) => {
    setSelectedAgentForActions(agent);
    setAgentActions(agent.actions || []);
    setActiveTab('actions');
  };

  const handleCreateAction = async (data: CreateVoiceActionPayload) => {
    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/voice-agents/actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to create action');
    
    const newAction = await res.json();
    setAgentActions(prev => [...prev, newAction]);
    setShowActionForm(false);
    await fetchAgents();
  };

  const handleUpdateAction = async (data: CreateVoiceActionPayload) => {
    if (!editingAction) return;

    const token = localStorage.getItem('access_token');
    const res = await fetch(`/api/voice-agents/actions/${editingAction.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to update action');
    
    const updatedAction = await res.json();
    setAgentActions(prev => prev.map(a => a.id === updatedAction.id ? updatedAction : a));
    setEditingAction(null);
    await fetchAgents();
  };

  const handleDeleteAction = async (actionId: string, agentId: string) => {
    if (!confirm('Are you sure you want to delete this action?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/voice-agents/actions/${actionId}?agentId=${agentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete action');
      setAgentActions(prev => prev.filter(a => a.id !== actionId));
      await fetchAgents();
    } catch (error) {
      console.error('Error deleting action:', error);
    }
  };

  // Knowledge base functions
  const fetchKnowledgeBases = async () => {
    setLoadingKBs(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/knowledge-bases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch knowledge bases');
      }
      
      const data = await res.json();
      console.log('Knowledge bases response:', data);
      
      // Handle different possible response structures
      const kbs = data.knowledgeBases || data.data?.knowledgeBases || data.data || [];
      setKnowledgeBases(Array.isArray(kbs) ? kbs : []);
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
      toast.error('Failed to fetch knowledge bases');
      setKnowledgeBases([]);
    } finally {
      setLoadingKBs(false);
    }
  };

  const handleCreateKB = async () => {
    if (!kbFormData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/knowledge-bases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(kbFormData),
      });

      if (!res.ok) throw new Error('Failed to create knowledge base');
      
      toast.success('Knowledge base created successfully!');
      setShowKBForm(false);
      setKBFormData({ name: '', description: '' });
      await fetchKnowledgeBases();
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      toast.error('Failed to create knowledge base');
    }
  };

  const handleUpdateKB = async () => {
    if (!editingKB || !kbFormData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/knowledge-bases/${editingKB.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(kbFormData),
      });

      if (!res.ok) throw new Error('Failed to update knowledge base');
      
      toast.success('Knowledge base updated successfully!');
      setShowKBForm(false);
      setEditingKB(null);
      setKBFormData({ name: '', description: '' });
      await fetchKnowledgeBases();
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      toast.error('Failed to update knowledge base');
    }
  };

  const handleDeleteKB = async (kbId: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/knowledge-bases/${kbId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete knowledge base');
      toast.success('Knowledge base deleted successfully!');
      await fetchKnowledgeBases();
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      toast.error('Failed to delete knowledge base');
    }
  };

  // ==================== CRAWLER HANDLERS ====================
  
  const fetchTextFromUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch text content');
      return await response.text();
    } catch (error) {
      console.error('Error fetching text from URL:', error);
      return 'Failed to load content from URL.';
    }
  };
  
  const fetchWebsiteUrls = async (kbId: string) => {
    setLoadingUrls(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/knowledge-bases/${kbId}/urls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch website URLs');
      }
      
      const data = await res.json();
      console.log('Website URLs response:', data);
      
      // Handle different possible response structures
      const urls = data.urls || data.data?.urls || data.data || [];
      console.log('Parsed URLs:', urls);
      if (urls.length > 0) {
        console.log('Sample URL object:', JSON.stringify(urls[0], null, 2));
        console.log('URL fields:', Object.keys(urls[0]));
      }
      setWebsiteUrls(Array.isArray(urls) ? urls : []);
    } catch (error) {
      console.error('Error fetching website URLs:', error);
      toast.error('Failed to fetch website URLs');
      setWebsiteUrls([]);
    } finally {
      setLoadingUrls(false);
    }
  };

  const handleDiscoverWebsite = async () => {
    if (!selectedKB || !discoveryUrl.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    setDiscovering(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/knowledge-bases/${selectedKB.id}/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          url: discoveryUrl,
          mode: crawlMode // exact, path, or domain
        }),
      });

      if (!res.ok) throw new Error('Failed to discover website');
      
      toast.success('Website crawling started! This may take a few moments.');
      setDiscoveryUrl('');
      setCrawlMode('exact');
      // Poll for status
      setTimeout(() => fetchWebsiteUrls(selectedKB.id), 3000);
    } catch (error) {
      console.error('Error discovering website:', error);
      toast.error('Failed to discover website');
    } finally {
      setDiscovering(false);
    }
  };

  const handleTrainUrls = async () => {
    if (!selectedKB || selectedUrls.size === 0) {
      toast.error('Please select URLs to train');
      return;
    }

    setTraining(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/knowledge-bases/${selectedKB.id}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ urlIds: Array.from(selectedUrls) }),
      });

      if (!res.ok) throw new Error('Failed to train URLs');
      
      toast.success('Training started for selected URLs!');
      setSelectedUrls(new Set());
      setTimeout(() => fetchWebsiteUrls(selectedKB.id), 3000);
    } catch (error) {
      console.error('Error training URLs:', error);
      toast.error('Failed to train URLs');
    } finally {
      setTraining(false);
    }
  };

  const handleDeleteUrls = async () => {
    if (!selectedKB || selectedUrls.size === 0) {
      toast.error('Please select URLs to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedUrls.size} URL(s)?`)) return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/knowledge-bases/${selectedKB.id}/urls`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ urlIds: Array.from(selectedUrls) }),
      });

      if (!res.ok) throw new Error('Failed to delete URLs');
      
      toast.success('URLs deleted successfully!');
      setSelectedUrls(new Set());
      await fetchWebsiteUrls(selectedKB.id);
    } catch (error) {
      console.error('Error deleting URLs:', error);
      toast.error('Failed to delete URLs');
    }
  };

  // ==================== FAQ HANDLERS ====================
  
  const fetchFaqs = async (kbId: string) => {
    setLoadingFaqs(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/knowledge-bases/${kbId}/faqs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch FAQs');
      }
      
      const data = await res.json();
      console.log('FAQs response:', data);
      
      // Handle different possible response structures
      const faqs = data.faqs || data.data?.faqs || data.data || [];
      setFaqs(Array.isArray(faqs) ? faqs : []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to fetch FAQs');
      setFaqs([]);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const handleCreateFaq = async () => {
    if (!selectedKB || !faqFormData.question.trim() || !faqFormData.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/knowledge-bases/${selectedKB.id}/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(faqFormData),
      });

      if (!res.ok) throw new Error('Failed to create FAQ');
      
      toast.success('FAQ created successfully!');
      setShowFaqForm(false);
      setFaqFormData({ question: '', answer: '' });
      await fetchFaqs(selectedKB.id);
    } catch (error) {
      console.error('Error creating FAQ:', error);
      toast.error('Failed to create FAQ');
    }
  };

  const handleUpdateFaq = async () => {
    if (!selectedKB || !editingFaq || !faqFormData.question.trim() || !faqFormData.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/knowledge-bases/${selectedKB.id}/faqs/${editingFaq.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(faqFormData),
      });

      if (!res.ok) throw new Error('Failed to update FAQ');
      
      toast.success('FAQ updated successfully!');
      setShowFaqForm(false);
      setEditingFaq(null);
      setFaqFormData({ question: '', answer: '' });
      await fetchFaqs(selectedKB.id);
    } catch (error) {
      console.error('Error updating FAQ:', error);
      toast.error('Failed to update FAQ');
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    if (!selectedKB) return;
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/knowledge-bases/${selectedKB.id}/faqs/${faqId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete FAQ');
      toast.success('FAQ deleted successfully!');
      await fetchFaqs(selectedKB.id);
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ');
    }
  };

  const filteredAgents = agents.filter((agent) => {
    if (!search) return true; // Show all when no search term
    const searchLower = search.toLowerCase();
    const nameMatch = agent.agentName?.toLowerCase().includes(searchLower);
    const businessMatch = agent.businessName?.toLowerCase().includes(searchLower);
    const promptMatch = agent.agentPrompt?.toLowerCase().includes(searchLower);
    return nameMatch || businessMatch || promptMatch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-foreground flex items-center justify-center">
              <Bot className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Voice Agents</h1>
              <p className="text-muted-foreground text-sm">
                Manage your intelligent voice assistants
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={fetchAgents}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </Button>
          {activeTab === 'agents' && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Agent
            </Button>
          )}
          {activeTab === 'knowledge' && (
            <Button onClick={() => {
              setEditingKB(null);
              setKBFormData({ name: '', description: '' });
              setShowKBForm(true);
            }} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Knowledge Base
            </Button>
          )}
          {activeTab === 'actions' && selectedAgentForActions && (
            <Button onClick={() => setShowActionForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Action
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/50">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('agents')}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
              activeTab === 'agents'
                ? 'border-violet-500 text-violet-600'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Phone className="w-4 h-4" />
            Agents ({agents.length})
          </button>
          <button
            onClick={() => setActiveTab('call-logs')}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
              activeTab === 'call-logs'
                ? 'border-violet-500 text-violet-600'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <PhoneCall className="w-4 h-4" />
            Call Logs
          </button>
          <button
            onClick={() => {
              setActiveTab('knowledge');
              fetchKnowledgeBases();
            }}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
              activeTab === 'knowledge'
                ? 'border-violet-500 text-violet-600'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Bot className="w-4 h-4" />
            Knowledge
          </button>
          {selectedAgentForActions && (
            <button
              onClick={() => setActiveTab('actions')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors",
                activeTab === 'actions'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <Zap className="w-4 h-4" />
              Actions: {selectedAgentForActions.agentName}
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'agents' && (
        <>
          {/* Search */}
          <Card className="border-border/50 shadow-sm">
            <div className="px-6 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search voice agents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </Card>

          {/* Agents Table */}
          <Card padding="none" className="border-border/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">AI Voice Agents</h3>
                  <p className="text-sm text-muted-foreground">
                    {loading ? 'Loading...' : `${filteredAgents.length} agents found`}
                  </p>
                </div>
              </div>
            </div>

        {loading ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {search ? 'No agents found' : 'No voice agents yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search 
                ? 'Try adjusting your search terms.' 
                : 'Get started by creating your first voice agent.'}
            </p>
            {!search && (
              <Button 
                onClick={() => setShowForm(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create your first voice agent
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Agent Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border/50">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mr-3">
                          <Phone className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {agent.agentName || agent.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-foreground text-background">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{agent.language || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground max-w-md line-clamp-2">
                        {agent.welcomeMessage || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleCallAgent(agent)}
                          className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                          title="Make test call"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleManageActions(agent)}
                          className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                          title="Manage actions"
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditAgent(agent)}
                          className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                          title="Edit agent"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                          title="Delete agent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </Card>
        </>
      )}

      {/* Call Logs Tab */}
      {activeTab === 'call-logs' && (
        <CallLogsView agents={agents} />
      )}

      {/* Actions Tab */}
      {activeTab === 'actions' && selectedAgentForActions && (
        <Card padding="none" className="border-border/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50 bg-muted/30">
            <div>
              <h3 className="font-semibold text-foreground">Actions for {selectedAgentForActions.agentName}</h3>
              <p className="text-sm text-muted-foreground">Configure automated actions for this voice agent</p>
            </div>
          </div>

          {agentActions.length === 0 ? (
            <div className="p-12 text-center">
              <Zap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No actions configured</h3>
              <p className="text-gray-500 mt-2">Add actions like call transfers, SMS, or workflow triggers.</p>
              <Button className="mt-4" onClick={() => setShowActionForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Action
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {agentActions.map((action) => (
                <div key={action.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{action.name}</h4>
                        <p className="text-xs text-gray-500">{action.actionType.replace(/_/g, ' ')}</p>
                        {action.actionParameters?.triggerPrompt && (
                          <p className="text-xs text-gray-400 mt-1 max-w-md line-clamp-1">
                            Trigger: {action.actionParameters.triggerPrompt}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingAction(action)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit action"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAction(action.id, selectedAgentForActions.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete action"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Knowledge Tab */}
      {activeTab === 'knowledge' && !selectedKB && (
        <Card padding="none" className="border-border/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50 bg-muted/30">
            <div>
              <h3 className="font-semibold text-foreground">Knowledge Bases</h3>
              <p className="text-sm text-muted-foreground">Manage knowledge bases for your voice agents</p>
            </div>
          </div>

          {loadingKBs ? (
            <div className="p-12 text-center">
              <div className="text-muted-foreground">Loading knowledge bases...</div>
            </div>
          ) : knowledgeBases.length === 0 ? (
            <div className="p-12 text-center">
              <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">No knowledge bases found</h3>
              <p className="text-muted-foreground mt-2">Create knowledge bases to provide information to your voice agents.</p>
              <Button className="mt-4" onClick={() => setShowKBForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Knowledge Base
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {knowledgeBases.map((kb) => (
                <div key={kb.id} className="p-6 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        console.log('Selecting KB:', kb);
                        setSelectedKB(kb);
                        setKbSubTab('crawler');
                        fetchWebsiteUrls(kb.id);
                        fetchFaqs(kb.id);
                      }}
                      className="flex items-center gap-4 flex-1 text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">{kb.name}</h4>
                        {kb.description && kb.description.trim() && (
                          <p className="text-xs text-muted-foreground">{kb.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {new Date(kb.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingKB(kb);
                          setKBFormData({ name: kb.name, description: kb.description || '' });
                          setShowKBForm(true);
                        }}
                        className="p-2 text-foreground/60 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        title="Edit knowledge base"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteKB(kb.id);
                        }}
                        className="p-2 text-foreground/60 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        title="Delete knowledge base"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Knowledge Base Details View */}
      {activeTab === 'knowledge' && selectedKB && (
        <Card padding="none" className="border-border/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedKB(null)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Back to list"
                >
                  ←
                </button>
                <div>             
                  <h3 className="font-semibold text-foreground">{selectedKB.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedKB.description || 'No description'}</p>
                </div>
              </div>
            </div>
            
            {/* Sub-tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setKbSubTab('crawler')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  kbSubTab === 'crawler'
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-muted"
                )}
              >
                Crawler
              </button>
              <button
                onClick={() => setKbSubTab('faq')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  kbSubTab === 'faq'
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-muted"
                )}
              >
                FAQ
              </button>
            </div>
          </div>

          {/* Crawler Sub-tab */}
          {kbSubTab === 'crawler' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="font-medium text-foreground">Knowledge Sources</h4>
                  <p className="text-xs text-muted-foreground mt-1">Add and manage sources your bot will use to learn and respond to users.</p>
                </div>
                <Button onClick={() => setShowCrawlerModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Source
                </Button>
              </div>

              {loadingUrls ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : websiteUrls.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border/50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">No crawled links yet</p>
                  <Button onClick={() => setShowCrawlerModal(true)} variant="secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Source
                  </Button>
                </div>
              ) : (
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <div className="bg-muted/30 border-b border-border/50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Uploaded Links ({websiteUrls.length})
                      </span>
                      <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Auto-Refresh
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/10 border-b border-border/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-12">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUrls(new Set(websiteUrls.map(u => u.id)));
                                } else {
                                  setSelectedUrls(new Set());
                                }
                              }}
                              checked={selectedUrls.size === websiteUrls.length && websiteUrls.length > 0}
                              className="rounded"
                            />
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Path</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Data Refreshed At</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {websiteUrls.map((url) => (
                          <tr key={url.id} className="hover:bg-muted/5">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedUrls.has(url.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedUrls);
                                  if (e.target.checked) {
                                    newSelected.add(url.id);
                                  } else {
                                    newSelected.delete(url.id);
                                  }
                                  setSelectedUrls(newSelected);
                                }}
                                className="rounded"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <a 
                                href={url.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {url.url}
                              </a>
                            </td>
                            <td className="px-4 py-3">
                              {(() => {
                                // Check all possible trained indicators
                                const isTrained = 
                                  url.status?.toLowerCase() === 'trained' ||
                                  url.status?.toLowerCase() === 'completed' ||
                                  url.status?.toLowerCase() === 'success' ||
                                  url.state?.toLowerCase() === 'trained' ||
                                  url.trainedAt ||
                                  url.isTrained === true ||
                                  url.trained === true ||
                                  (url.content && url.content.length > 0) ||
                                  (url.scrapedContent && url.scrapedContent.length > 0);
                                
                                const isCrawled = 
                                  url.status?.toLowerCase() === 'crawled' ||
                                  url.state?.toLowerCase() === 'crawled' ||
                                  url.crawledAt;
                                
                                if (isTrained) {
                                  return (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                      Trained
                                    </span>
                                  );
                                } else if (isCrawled) {
                                  return (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                      Crawled
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 text-xs font-medium">
                                      Pending
                                    </span>
                                  );
                                }
                              })()}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-muted-foreground">
                                {(() => {
                                  // Check multiple possible date fields from GHL API
                                  const date = url.trainedAt || 
                                               url.crawledAt || 
                                               url.updatedAt || 
                                               url.createdAt ||
                                               url.lastModified ||
                                               url.dataRefreshedAt ||
                                               url.refreshedAt;
                                  
                                  if (!date) return '-';
                                  
                                  try {
                                    return new Date(date).toLocaleString('en-US', {
                                      month: '2-digit',
                                      day: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    });
                                  } catch {
                                    return '-';
                                  }
                                })()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async () => {
                                    setViewingScrapedData(url);
                                    setShowScrapedDataModal(true);
                                    setLoadingScrapedContent(true);
                                    setScrapedTextContent('');
                                    
                                    // Check if content is a URL and fetch it
                                    const contentValue = url.content || url.scrapedContent || url.text || url.data || '';
                                    if (contentValue && (contentValue.startsWith('http://') || contentValue.startsWith('https://'))) {
                                      const text = await fetchTextFromUrl(contentValue);
                                      setScrapedTextContent(text);
                                    } else {
                                      setScrapedTextContent(contentValue);
                                    }
                                    setLoadingScrapedContent(false);
                                  }}
                                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                  title="View scraped data"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    fetchWebsiteUrls(selectedKB.id);
                                    toast.success('Refreshing data...');
                                  }}
                                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                  title="Refresh"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUrls(new Set([url.id]));
                                    handleDeleteUrls();
                                  }}
                                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {selectedUrls.size > 0 && (
                    <div className="bg-muted/20 border-t border-border/50 px-4 py-3 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {selectedUrls.size} selected
                      </span>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={handleDeleteUrls}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Selected
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FAQ Sub-tab */}
          {kbSubTab === 'faq' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-medium text-foreground">FAQs</h4>
                <Button onClick={() => setShowFaqForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add FAQ
                </Button>
              </div>

              {loadingFaqs ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : faqs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No FAQs added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="border border-border/50 rounded-lg p-4 hover:border-foreground/20 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h5 className="font-medium text-foreground mb-1">{faq.question}</h5>
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingFaq(faq);
                              setFaqFormData({ question: faq.question, answer: faq.answer });
                              setShowFaqForm(true);
                            }}
                            className="p-2 text-foreground/60 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="p-2 text-foreground/60 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Create Form */}
      <VoiceAgentForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateAgent}
        mode="create"
        onNavigateToKnowledgeTab={() => {
          setActiveTab('knowledge');
          fetchKnowledgeBases();
          setShowKBForm(true);
        }}
      />

      {/* Edit Form */}
      {editingAgent && (
        <VoiceAgentForm
          isOpen={true}
          onClose={() => setEditingAgent(null)}
          onSubmit={handleUpdateAgent}
          onNavigateToKnowledgeTab={() => {
            setActiveTab('knowledge');
            fetchKnowledgeBases();
            setShowKBForm(true);
          }}
          initialData={{
            agentName: editingAgent.agentName,
            businessName: editingAgent.businessName,
            welcomeMessage: editingAgent.welcomeMessage,
            agentPrompt: editingAgent.agentPrompt,
            voiceId: editingAgent.voiceId,
            language: editingAgent.language as 'en-US' | 'pt-BR' | 'es' | 'fr' | 'de' | 'it' | 'nl-NL' | 'multi' | undefined,
            timezone: editingAgent.timezone,
            patienceLevel: editingAgent.patienceLevel,
            maxCallDuration: editingAgent.maxCallDuration,
            sendUserIdleReminders: editingAgent.sendUserIdleReminders,
            reminderAfterIdleTimeSeconds: editingAgent.reminderAfterIdleTimeSeconds,
            isAgentAsBackupDisabled: editingAgent.isAgentAsBackupDisabled,
            // Handle both inboundNumber (string) and inboundNumbers (array) from GHL API
            inboundNumber: editingAgent.inboundNumbers && editingAgent.inboundNumbers.length > 0
              ? editingAgent.inboundNumbers.join(',')
              : (editingAgent.inboundNumber ?? undefined),
            sendPostCallNotificationTo: editingAgent.sendPostCallNotificationTo,
            translation: editingAgent.translation ? {
              enabled: editingAgent.translation.enabled,
              language: editingAgent.translation.language ?? undefined,
            } : undefined,
          }}
          mode="edit"
        />
      )}

      {/* Create Action Form */}
      {selectedAgentForActions && (
        <VoiceActionForm
          isOpen={showActionForm}
          onClose={() => setShowActionForm(false)}
          onSubmit={handleCreateAction}
          agentId={selectedAgentForActions.id}
          mode="create"
        />
      )}

      {/* Edit Action Form */}
      {editingAction && selectedAgentForActions && (
        <VoiceActionForm
          isOpen={true}
          onClose={() => setEditingAction(null)}
          onSubmit={handleUpdateAction}
          agentId={selectedAgentForActions.id}
          initialData={editingAction}
          mode="edit"
        />
      )}

      {/* Call Modal */}
      <Modal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        title="Make Test Call"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Initiate a test call with <strong>{selectedAgent?.agentName}</strong>
            </p>
            <Input
              label="Phone Number"
              type="tel"
              value={callPhoneNumber}
              onChange={(e) => setCallPhoneNumber(e.target.value)}
              placeholder="+1 (555) 000-0000"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowCallModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleMakeCall} loading={calling}>
              <Phone className="w-4 h-4 mr-2" />
              Call Now
            </Button>
          </div>
        </div>
      </Modal>

      {/* Knowledge Base Form Modal */}
      <Modal
        isOpen={showKBForm}
        onClose={() => {
          setShowKBForm(false);
          setEditingKB(null);
          setKBFormData({ name: '', description: '' });
        }}
        title={editingKB ? 'Edit Knowledge Base' : 'Create Knowledge Base'}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={kbFormData.name}
            onChange={(e) => setKBFormData({ ...kbFormData, name: e.target.value })}
            placeholder="Enter knowledge base name"
            required
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={kbFormData.description}
              onChange={(e) => setKBFormData({ ...kbFormData, description: e.target.value })}
              placeholder="Enter description (optional)"
              rows={4}
              className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="secondary"
              onClick={() => {
                setShowKBForm(false);
                setEditingKB(null);
                setKBFormData({ name: '', description: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingKB ? handleUpdateKB : handleCreateKB}
              disabled={!kbFormData.name}
            >
              {editingKB ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Web Crawler Modal */}
      <Modal
        isOpen={showCrawlerModal}
        onClose={() => {
          setShowCrawlerModal(false);
          setDiscoveryUrl('');
          setCrawlMode('exact');
        }}
        title="Web Crawler"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Crawl and extract content from a website to train your bot.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Enter Domain
            </label>
            
            {/* Crawl Mode Tabs */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setCrawlMode('exact')}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  crawlMode === 'exact'
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground border border-border hover:bg-muted"
                )}
              >
                Exact URL
              </button>
              <button
                onClick={() => setCrawlMode('path')}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  crawlMode === 'path'
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground border border-border hover:bg-muted"
                )}
              >
                All URLs with the path
              </button>
              <button
                onClick={() => setCrawlMode('domain')}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  crawlMode === 'domain'
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground border border-border hover:bg-muted"
                )}
              >
                All URLs in this domain
              </button>
            </div>
            
            <Input
              value={discoveryUrl}
              onChange={(e) => setDiscoveryUrl(e.target.value)}
              placeholder="Enter URL"
              className="mb-2"
            />
            
            <p className="text-xs text-muted-foreground">
              {crawlMode === 'exact' && 'Crawl only the exact URL you provide'}
              {crawlMode === 'path' && 'Crawl all URLs that start with the provided path'}
              {crawlMode === 'domain' && 'Crawl all URLs within the provided domain'}
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCrawlerModal(false);
                setDiscoveryUrl('');
                setCrawlMode('exact');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await handleDiscoverWebsite();
                setShowCrawlerModal(false);
              }}
              disabled={!discoveryUrl.trim()}
              loading={discovering}
            >
              Extract Data
            </Button>
          </div>
        </div>
      </Modal>

      {/* FAQ Form Modal */}
      <Modal
        isOpen={showFaqForm}
        onClose={() => {
          setShowFaqForm(false);
          setEditingFaq(null);
          setFaqFormData({ question: '', answer: '' });
        }}
        title={editingFaq ? 'Edit FAQ' : 'Create FAQ'}
      >
        <div className="space-y-4">
          <Input
            label="Question"
            value={faqFormData.question}
            onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })}
            placeholder="Enter question"
            required
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Answer
            </label>
            <textarea
              value={faqFormData.answer}
              onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })}
              placeholder="Enter answer"
              rows={6}
              className="w-full px-3 py-2 border border-muted rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="secondary"
              onClick={() => {
                setShowFaqForm(false);
                setEditingFaq(null);
                setFaqFormData({ question: '', answer: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingFaq ? handleUpdateFaq : handleCreateFaq}
              disabled={!faqFormData.question || !faqFormData.answer}
            >
              {editingFaq ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Scraped Data Viewer Modal */}
      <Modal
        isOpen={showScrapedDataModal}
        onClose={() => {
          setShowScrapedDataModal(false);
          setViewingScrapedData(null);
        }}
        title="Data scrapped from website"
        size="3xl"
      >
        <div className="space-y-4">
          {viewingScrapedData && (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-medium text-foreground">
                  {viewingScrapedData.title || viewingScrapedData.url}
                </h3>
                <span className="text-xs text-muted-foreground">
                  Last Updated on {(() => {
                    const date = viewingScrapedData.trainedAt || 
                                 viewingScrapedData.crawledAt || 
                                 viewingScrapedData.updatedAt ||
                                 viewingScrapedData.createdAt ||
                                 viewingScrapedData.lastModified;
                    
                    if (!date) return 'N/A';
                    
                    return new Date(date).toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric', 
                      hour: 'numeric', 
                      minute: '2-digit', 
                      hour12: true 
                    });
                  })()}
                </span>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  {loadingScrapedContent ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading content...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {scrapedTextContent || 'No content available. The page may not have been crawled yet.'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
                <span>
                  {scrapedTextContent.split(/\s+/).filter(Boolean).length} words used
                </span>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowScrapedDataModal(false);
                    setViewingScrapedData(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    if (viewingScrapedData.url) {
                      window.open(viewingScrapedData.url, '_blank');
                    }
                  }}
                >
                  Visit Source
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}