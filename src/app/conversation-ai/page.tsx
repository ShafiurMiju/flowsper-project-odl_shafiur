'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Input, Modal, Select } from '@/components/ui';
import { 
  GHLConversationAIAgent, 
  GHLKnowledgeBase,
  CreateConversationAIAgentPayload,
  ConversationAIAgentMode,
  ConversationAIChannel,
  GHLConversationAIAction,
} from '@/types';
import { 
  Bot, 
  Plus, 
  RefreshCw, 
  Trash2, 
  MessageSquare,
  Power,
  PowerOff,
  Edit,
  Eye,
  Brain,
  Settings,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const AGENT_MODES: { value: ConversationAIAgentMode; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'suggestive', label: 'Suggestive' },
  { value: 'auto-pilot', label: 'Auto-Pilot' },
];

const CHANNELS: { value: ConversationAIChannel; label: string }[] = [
  { value: 'SMS', label: 'SMS' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'FB', label: 'Facebook' },
  { value: 'IG', label: 'Instagram' },
  { value: 'WebChat', label: 'Web Chat' },
  { value: 'Live_Chat', label: 'Live Chat' },
];

const DEFAULT_FORM_DATA: Partial<CreateConversationAIAgentPayload> = {
  name: '',
  businessName: '',
  mode: 'off',
  channels: [],
  isPrimary: false,
  waitTime: 2,
  waitTimeUnit: 'seconds',
  sleepEnabled: false,
  personality: '',
  goal: '',
  instructions: '',
  autoPilotMaxMessages: 75,
  knowledgeBaseIds: [],
  respondToImages: false,
  respondToAudio: false,
};

export default function ConversationAIPage() {
  const [agents, setAgents] = useState<GHLConversationAIAgent[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<GHLKnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<GHLConversationAIAgent | null>(null);
  const [agentActions, setAgentActions] = useState<GHLConversationAIAction[]>([]);
  const [formData, setFormData] = useState<Partial<CreateConversationAIAgentPayload>>(DEFAULT_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<ConversationAIChannel[]>([]);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/conversation-ai/agents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchKnowledgeBases = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/knowledge-bases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(data.knowledgeBases || []);
      }
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
    }
  }, []);

  const fetchAgentActions = useCallback(async (agentId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/conversation-ai/agents/${agentId}/actions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAgentActions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching agent actions:', error);
      setAgentActions([]);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    fetchKnowledgeBases();
  }, [fetchAgents, fetchKnowledgeBases]);

  const handleCreateAgent = async () => {
    if (!formData.name || !formData.personality || !formData.goal || !formData.instructions) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Build payload, excluding sleepTime/sleepTimeUnit when sleepEnabled is false
      const payload: any = {
        ...formData,
        channels: selectedChannels,
      };
      
      // Only include sleep time fields if sleepEnabled is true
      if (!formData.sleepEnabled) {
        delete payload.sleepTime;
        delete payload.sleepTimeUnit;
      }
      
      const response = await fetch('/api/conversation-ai/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create agent');
      }

      toast.success('Agent created successfully');
      setShowCreateModal(false);
      setFormData(DEFAULT_FORM_DATA);
      setSelectedChannels([]);
      fetchAgents();
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error(String(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Build payload, excluding sleepTime/sleepTimeUnit when sleepEnabled is false
      const payload: any = {
        ...formData,
        channels: selectedChannels,
        autoPilotMaxMessages: formData.autoPilotMaxMessages || 75,
      };
      
      // Only include sleep time fields if sleepEnabled is true
      if (!formData.sleepEnabled) {
        delete payload.sleepTime;
        delete payload.sleepTimeUnit;
      }
      
      const response = await fetch(`/api/conversation-ai/agents/${selectedAgent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to update agent');
      }

      toast.success('Agent updated successfully');
      setShowEditModal(false);
      setSelectedAgent(null);
      setFormData(DEFAULT_FORM_DATA);
      setSelectedChannels([]);
      fetchAgents();
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error(String(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/conversation-ai/agents/${agentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }

      toast.success('Agent deleted successfully');
      fetchAgents();
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    }
  };

  const handleToggleMode = async (agent: GHLConversationAIAgent) => {
    const newMode: ConversationAIAgentMode = agent.mode === 'auto-pilot' ? 'off' : 'auto-pilot';
    
    try {
      const token = localStorage.getItem('access_token');
      
      // Build payload, excluding sleepTime/sleepTimeUnit when sleepEnabled is false
      const payload: any = {
        name: agent.name,
        businessName: agent.businessName,
        mode: newMode,
        channels: agent.channels,
        isPrimary: agent.isPrimary,
        waitTime: agent.waitTime,
        waitTimeUnit: agent.waitTimeUnit,
        sleepEnabled: agent.sleepEnabled,
        personality: agent.personality,
        goal: agent.goal,
        instructions: agent.instructions,
        autoPilotMaxMessages: agent.autoPilotMaxMessages || 75,
        knowledgeBaseIds: agent.knowledgeBaseIds,
        respondToImages: agent.respondToImages,
        respondToAudio: agent.respondToAudio,
      };
      
      // Only include sleep time fields if sleepEnabled is true
      if (agent.sleepEnabled) {
        payload.sleepTime = agent.sleepTime;
        payload.sleepTimeUnit = agent.sleepTimeUnit;
      }
      
      const response = await fetch(`/api/conversation-ai/agents/${agent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update agent mode');
      }

      toast.success(`Agent ${newMode === 'auto-pilot' ? 'activated' : 'deactivated'}`);
      fetchAgents();
    } catch (error) {
      console.error('Error updating agent mode:', error);
      toast.error('Failed to update agent mode');
    }
  };

  const openEditModal = (agent: GHLConversationAIAgent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      businessName: agent.businessName,
      mode: agent.mode,
      isPrimary: agent.isPrimary,
      waitTime: agent.waitTime,
      waitTimeUnit: agent.waitTimeUnit,
      sleepEnabled: agent.sleepEnabled,
      sleepTime: agent.sleepTime,
      sleepTimeUnit: agent.sleepTimeUnit,
      personality: agent.personality,
      goal: agent.goal,
      instructions: agent.instructions,
      autoPilotMaxMessages: agent.autoPilotMaxMessages,
      knowledgeBaseIds: agent.knowledgeBaseIds,
      respondToImages: agent.respondToImages,
      respondToAudio: agent.respondToAudio,
    });
    setSelectedChannels(agent.channels || []);
    setShowEditModal(true);
  };

  const openViewModal = (agent: GHLConversationAIAgent) => {
    setSelectedAgent(agent);
    setShowViewModal(true);
  };

  const openActionsModal = async (agent: GHLConversationAIAgent) => {
    setSelectedAgent(agent);
    await fetchAgentActions(agent.id);
    setShowActionsModal(true);
  };

  const toggleChannel = (channel: ConversationAIChannel) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const getModeColor = (mode: ConversationAIAgentMode) => {
    switch (mode) {
      case 'auto-pilot': return 'bg-green-100 text-green-800';
      case 'suggestive': return 'bg-yellow-100 text-yellow-800';
      case 'off': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Stats calculation
  const stats = {
    total: agents.length,
    autoPilot: agents.filter(a => a.mode === 'auto-pilot').length,
    suggestive: agents.filter(a => a.mode === 'suggestive').length,
    off: agents.filter(a => a.mode === 'off').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-600" />
            Conversation AI
          </h1>
          <p className="text-gray-600 mt-1">Manage AI agents for automated conversations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchAgents} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => { setFormData(DEFAULT_FORM_DATA); setSelectedChannels([]); setShowCreateModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Agents</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Bot className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Auto-Pilot</p>
              <p className="text-2xl font-bold text-green-600">{stats.autoPilot}</p>
            </div>
            <Power className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Suggestive</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.suggestive}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Off</p>
              <p className="text-2xl font-bold text-gray-600">{stats.off}</p>
            </div>
            <PowerOff className="w-8 h-8 text-gray-600" />
          </div>
        </Card>
      </div>

      {/* Agents Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channels</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Primary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wait Time</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading agents...
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No agents found</p>
                    <p className="text-sm mt-1">Create your first AI agent to get started</p>
                  </td>
                </tr>
              ) : (
                agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{agent.name}</p>
                          {agent.businessName && (
                            <p className="text-sm text-gray-500">{agent.businessName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getModeColor(agent.mode)}`}>
                        {agent.mode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {agent.channels?.slice(0, 3).map((channel) => (
                          <span key={channel} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                            {channel}
                          </span>
                        ))}
                        {agent.channels && agent.channels.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            +{agent.channels.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${agent.isPrimary ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {agent.isPrimary ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {agent.waitTime} {agent.waitTimeUnit}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleMode(agent)}
                          className={`p-1.5 rounded hover:bg-gray-100 ${agent.mode === 'auto-pilot' ? 'text-green-600' : 'text-gray-400'}`}
                          title={agent.mode === 'auto-pilot' ? 'Deactivate' : 'Activate'}
                        >
                          {agent.mode === 'auto-pilot' ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openActionsModal(agent)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                          title="View Actions"
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openViewModal(agent)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(agent)}
                          className="p-1.5 rounded hover:bg-gray-100 text-blue-600"
                          title="Edit Agent"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="p-1.5 rounded hover:bg-gray-100 text-red-600"
                          title="Delete Agent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Agent Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => { 
          setShowCreateModal(false); 
          setShowEditModal(false); 
          setFormData(DEFAULT_FORM_DATA);
          setSelectedChannels([]);
        }}
        title={showEditModal ? 'Edit Agent' : 'Create Agent'}
        size="2xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name *</label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sales Assistant"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <Input
                value={formData.businessName || ''}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g., Tech Corp"
              />
            </div>
          </div>

          {/* Mode & Primary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <Select
                value={formData.mode || 'off'}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value as ConversationAIAgentMode })}
                options={AGENT_MODES}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary || false}
                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700">Primary Agent</label>
            </div>
          </div>

          {/* Channels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((channel) => (
                <button
                  key={channel.value}
                  type="button"
                  onClick={() => toggleChannel(channel.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedChannels.includes(channel.value)
                      ? 'bg-purple-100 border-purple-300 text-purple-800'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-purple-300'
                  }`}
                >
                  {channel.label}
                </button>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personality *</label>
            <textarea
              value={formData.personality || ''}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              placeholder="Describe the agent's personality traits..."
              className="w-full px-3 py-2 border rounded-lg text-sm min-h-20 resize-y focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal *</label>
            <textarea
              value={formData.goal || ''}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="What is this agent's main goal?"
              className="w-full px-3 py-2 border rounded-lg text-sm min-h-20 resize-y focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions *</label>
            <textarea
              value={formData.instructions || ''}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Provide detailed instructions for the agent..."
              className="w-full px-3 py-2 border rounded-lg text-sm min-h-25 resize-y focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Wait Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wait Time</label>
              <Input
                type="number"
                value={formData.waitTime || 2}
                onChange={(e) => setFormData({ ...formData, waitTime: Number(e.target.value) })}
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wait Time Unit</label>
              <Select
                value={formData.waitTimeUnit || 'seconds'}
                onChange={(e) => setFormData({ ...formData, waitTimeUnit: e.target.value as 'minutes' | 'seconds' })}
                options={[
                  { value: 'seconds', label: 'Seconds' },
                  { value: 'minutes', label: 'Minutes' },
                ]}
              />
            </div>
          </div>

          {/* Auto-pilot settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auto-Pilot Max Messages (1-100)
            </label>
            <Input
              type="number"
              value={formData.autoPilotMaxMessages || 75}
              onChange={(e) => setFormData({ ...formData, autoPilotMaxMessages: Math.min(100, Math.max(1, Number(e.target.value))) })}
              min={1}
              max={100}
            />
          </div>

          {/* Knowledge Base */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Knowledge Base</label>
            <Select
              value={(formData.knowledgeBaseIds || [])[0] || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                knowledgeBaseIds: e.target.value ? [e.target.value] : [] 
              })}
              options={[
                { value: '', label: 'None' },
                ...knowledgeBases.map(kb => ({ value: kb.id, label: kb.name }))
              ]}
            />
          </div>

          {/* Media Response Options */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="respondToImages"
                checked={formData.respondToImages || false}
                onChange={(e) => setFormData({ ...formData, respondToImages: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <label htmlFor="respondToImages" className="text-sm text-gray-700">Respond to Images</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="respondToAudio"
                checked={formData.respondToAudio || false}
                onChange={(e) => setFormData({ ...formData, respondToAudio: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <label htmlFor="respondToAudio" className="text-sm text-gray-700">Respond to Audio</label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setFormData(DEFAULT_FORM_DATA);
                setSelectedChannels([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={showEditModal ? handleUpdateAgent : handleCreateAgent}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : (showEditModal ? 'Update Agent' : 'Create Agent')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Agent Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedAgent(null); }}
        title="Agent Details"
        size="xl"
      >
        {selectedAgent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{selectedAgent.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Business</p>
                <p className="font-medium">{selectedAgent.businessName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mode</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getModeColor(selectedAgent.mode)}`}>
                  {selectedAgent.mode}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Primary</p>
                <p className="font-medium">{selectedAgent.isPrimary ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Channels</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedAgent.channels?.map((channel) => (
                  <span key={channel} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                    {channel}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Personality</p>
              <p className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedAgent.personality || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Goal</p>
              <p className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedAgent.goal || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Instructions</p>
              <p className="text-sm mt-1 bg-gray-50 p-2 rounded whitespace-pre-wrap">{selectedAgent.instructions || '-'}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Wait Time</p>
                <p className="font-medium">{selectedAgent.waitTime} {selectedAgent.waitTimeUnit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Max Messages</p>
                <p className="font-medium">{selectedAgent.autoPilotMaxMessages}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sleep Enabled</p>
                <p className="font-medium">{selectedAgent.sleepEnabled ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Actions Modal */}
      <Modal
        isOpen={showActionsModal}
        onClose={() => { setShowActionsModal(false); setSelectedAgent(null); setAgentActions([]); }}
        title={`Actions - ${selectedAgent?.name || ''}`}
        size="xl"
      >
        <div className="space-y-4">
          {agentActions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No actions configured for this agent</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agentActions.map((action) => (
                <div key={action.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium">{action.name}</p>
                        <p className="text-sm text-gray-500">Type: {action.type}</p>
                      </div>
                    </div>
                  </div>
                  {action.details && (
                    <div className="mt-2 text-sm text-gray-600">
                      {action.details.triggerCondition && (
                        <p><span className="font-medium">Condition:</span> {action.details.triggerCondition}</p>
                      )}
                      {action.details.triggerMessage && (
                        <p><span className="font-medium">Message:</span> {action.details.triggerMessage}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
