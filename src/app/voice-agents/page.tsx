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
  const [activeTab, setActiveTab] = useState<'agents' | 'call-logs' | 'actions'>('agents');
  const [showActionForm, setShowActionForm] = useState(false);
  const [editingAction, setEditingAction] = useState<GHLVoiceAction | null>(null);
  const [agentActions, setAgentActions] = useState<GHLVoiceAction[]>([]);
  const [selectedAgentForActions, setSelectedAgentForActions] = useState<GHLVoiceAgent | null>(null);

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

      {/* Create Form */}
      <VoiceAgentForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateAgent}
        mode="create"
      />

      {/* Edit Form */}
      {editingAgent && (
        <VoiceAgentForm
          isOpen={true}
          onClose={() => setEditingAgent(null)}
          onSubmit={handleUpdateAgent}
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
    </div>
  );
}
