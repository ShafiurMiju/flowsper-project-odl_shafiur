'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { CreateVoiceAgentPayload } from '@/types';

interface VoiceAgentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVoiceAgentPayload) => Promise<void>;
  initialData?: Partial<CreateVoiceAgentPayload>;
  mode: 'create' | 'edit';
  onNavigateToKnowledgeTab?: () => void;
}

const LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'nl-NL', label: 'Dutch' },
  { value: 'multi', label: 'Multilingual' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST)' },
  { value: 'America/Denver', label: 'America/Denver (MST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'America/Phoenix', label: 'America/Phoenix (MST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT)' },
];

const VOICES = [
  { value: 'jessica', label: 'Jessica - English, American, Female' },
  { value: 'michael', label: 'Michael - English, American, Male' },
  { value: 'sarah', label: 'Sarah - English, British, Female' },
  { value: 'james', label: 'James - English, British, Male' },
  { value: 'emma', label: 'Emma - English, Australian, Female' },
  { value: 'oliver', label: 'Oliver - English, Australian, Male' },
  { value: 'maria', label: 'Maria - Spanish, Female' },
  { value: 'carlos', label: 'Carlos - Spanish, Male' },
  { value: 'sophie', label: 'Sophie - French, Female' },
  { value: 'pierre', label: 'Pierre - French, Male' },
];

const LLM_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o ($0.080/min)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo ($0.100/min)' },
  { value: 'gpt-4', label: 'GPT-4 ($0.120/min)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo ($0.040/min)' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus ($0.150/min)' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet ($0.080/min)' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku ($0.025/min)' },
];

export function VoiceAgentForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  onNavigateToKnowledgeTab,
}: VoiceAgentFormProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [phoneNumbers, setPhoneNumbers] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPhones, setLoadingPhones] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Knowledge base state
  const [knowledgeBases, setKnowledgeBases] = useState<Array<{ value: string; label: string; description?: string }>>([]);
  const [loadingKBs, setLoadingKBs] = useState(false);
  const [showKBModal, setShowKBModal] = useState(false);
  const [kbModalMode, setKBModalMode] = useState<'create' | 'edit'>('create');
  const [editingKB, setEditingKB] = useState<{ id: string; name: string; description?: string } | null>(null);
  const [kbFormData, setKBFormData] = useState({ name: '', description: '' });
  const [savingKB, setSavingKB] = useState(false);
  
  const [formData, setFormData] = useState<CreateVoiceAgentPayload>({
    agentName: '',
    businessName: '',
    welcomeMessage: '',
    agentPrompt: '',
    voiceId: 'jessica',
    llmModel: 'gpt-4o',
    knowledgeBaseId: '',
    language: 'en-US',
    timezone: 'America/New_York',
    patienceLevel: 'high',
    maxCallDuration: 300,
    sendUserIdleReminders: true,
    reminderAfterIdleTimeSeconds: 8,
    isAgentAsBackupDisabled: false,
    inboundNumber: '',
    sendPostCallNotificationTo: {
      admins: false,
      allUsers: true,
      contactAssignedUser: false,
      specificUsers: [],
      customEmails: [],
    },
    translation: {
      enabled: false,
      language: 'es',
    },
  });
  const [selectedPhoneNumbers, setSelectedPhoneNumbers] = useState<string[]>([]);

  // Initialize form data only once when modal opens
  useEffect(() => {
    if (isOpen && !initialized) {
      if (initialData) {
        console.log('📋 Initial data received:', initialData);
        console.log('📞 inboundNumber from initialData:', initialData.inboundNumber);
        
        setFormData(prev => ({ ...prev, ...initialData }));
        
        // Parse selected phone numbers from inboundNumber or inboundNumbers
        let numbers: string[] = [];
        
        if (initialData.inboundNumber) {
          // If it's a comma-separated list, split it
          numbers = initialData.inboundNumber.includes(',') 
            ? initialData.inboundNumber.split(',').map(n => n.trim())
            : [initialData.inboundNumber];
        }
        
        console.log('📞 Parsed phone numbers for editing:', numbers);
        setSelectedPhoneNumbers(numbers);
      }
      setInitialized(true);
    }
    
    // Reset when modal closes
    if (!isOpen && initialized) {
      setInitialized(false);
      setStep(1);
    }
  }, [isOpen, initialData, initialized]);

  // Fetch phone numbers when reaching step 3
  useEffect(() => {
    if (isOpen && step === 3 && phoneNumbers.length === 0) {
      fetchPhoneNumbers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isOpen]);

  // Fetch knowledge bases when reaching step 2
  useEffect(() => {
    if (isOpen && step === 2 && knowledgeBases.length === 0) {
      fetchKnowledgeBases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isOpen]);

  const fetchKnowledgeBases = async () => {
    setLoadingKBs(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/knowledge-bases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.knowledgeBases && data.knowledgeBases.length > 0) {
        const kbs = data.knowledgeBases.map((kb: { id: string; name: string; description?: string }) => ({
          value: kb.id,
          label: kb.name,
          description: kb.description,
        }));
        setKnowledgeBases(kbs);
      } else {
        setKnowledgeBases([]);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge bases:', error);
      setKnowledgeBases([]);
    } finally {
      setLoadingKBs(false);
    }
  };

  const handleCreateKB = () => {
    // Close the modal and navigate to Knowledge tab
    if (onNavigateToKnowledgeTab) {
      onClose();
      onNavigateToKnowledgeTab();
    } else {
      // Fallback to showing the modal if no navigation callback provided
      setKBModalMode('create');
      setEditingKB(null);
      setKBFormData({ name: '', description: '' });
      setShowKBModal(true);
    }
  };

  const handleEditKB = (kbId: string) => {
    const kb = knowledgeBases.find(k => k.value === kbId);
    if (kb) {
      setKBModalMode('edit');
      setEditingKB({ id: kb.value, name: kb.label, description: kb.description });
      setKBFormData({ name: kb.label, description: kb.description || '' });
      setShowKBModal(true);
    }
  };

  const handleDeleteKB = async (kbId: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/knowledge-bases/${kbId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        // Clear selection if deleted KB was selected
        if (formData.knowledgeBaseId === kbId) {
          handleChange('knowledgeBaseId', '');
        }
        await fetchKnowledgeBases();
      } else {
        alert('Failed to delete knowledge base');
      }
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      alert('Failed to delete knowledge base');
    }
  };

  const handleSaveKB = async () => {
    if (!kbFormData.name.trim()) {
      alert('Name is required');
      return;
    }

    setSavingKB(true);
    try {
      const token = localStorage.getItem('access_token');
      
      if (kbModalMode === 'create') {
        const response = await fetch('/api/knowledge-bases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(kbFormData),
        });
        
        if (response.ok) {
          const data = await response.json();
          await fetchKnowledgeBases();
          // Auto-select the new knowledge base
          if (data.knowledgeBase?.id) {
            handleChange('knowledgeBaseId', data.knowledgeBase.id);
          }
          setShowKBModal(false);
        } else {
          alert('Failed to create knowledge base');
        }
      } else {
        const response = await fetch(`/api/knowledge-bases/${editingKB?.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(kbFormData),
        });
        
        if (response.ok) {
          await fetchKnowledgeBases();
          setShowKBModal(false);
        } else {
          alert('Failed to update knowledge base');
        }
      }
    } catch (error) {
      console.error('Error saving knowledge base:', error);
      alert('Failed to save knowledge base');
    } finally {
      setSavingKB(false);
    }
  };

  const fetchPhoneNumbers = async () => {
    setLoadingPhones(true);
    try {
      const token = localStorage.getItem('access_token');
      console.log('📞 Fetching phone numbers...');
      const response = await fetch('/api/phone-numbers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('📞 Response status:', response.status);
      const data = await response.json();
      console.log('📞 Response data:', data);
      
      if (data.phoneNumbers && data.phoneNumbers.length > 0) {
        const numbers = data.phoneNumbers.map((phone: { phoneNumber: string; friendlyName?: string }) => ({
          value: phone.phoneNumber,
          label: phone.friendlyName || phone.phoneNumber,
        }));
        console.log('📞 Mapped phone numbers:', numbers);
        setPhoneNumbers(numbers);
      } else {
        console.log('📞 No phone numbers in response');
        setPhoneNumbers([]);
      }
    } catch (error) {
      console.error('📞 Failed to fetch phone numbers:', error);
      setPhoneNumbers([]);
    } finally {
      setLoadingPhones(false);
    }
  };

  const handleChange = (field: keyof CreateVoiceAgentPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      sendPostCallNotificationTo: {
        ...prev.sendPostCallNotificationTo,
        [field]: value,
      },
    }));
  };

  const handleTranslationChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      translation: {
        enabled: prev.translation?.enabled ?? false,
        language: prev.translation?.language ?? 'es',
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow submission on step 3
    if (step !== 3) {
      console.log('Form submission prevented - not on step 3');
      return;
    }
    
    // Prevent double submission
    if (loading) {
      console.log('Form submission prevented - already loading');
      return;
    }
    
    if (!formData.agentName?.trim()) {
      alert('Agent name is required');
      return;
    }

    console.log('💾 Submitting form with selectedPhoneNumbers:', selectedPhoneNumbers);
    console.log('💾 formData.inboundNumber before submit:', formData.inboundNumber);

    setLoading(true);
    try {
      await onSubmit(formData);
      // Reset form and close modal on success
      setStep(1);
      onClose();
    } catch (error) {
      console.error('Error submitting voice agent:', error);
      alert('Failed to save voice agent. Please try again.');
    } finally {
      // Always stop loading, even if there's an error
      setLoading(false);
    }
  };

  const handlePhoneNumberAdd = (phoneNumber: string) => {
    if (!phoneNumber || selectedPhoneNumbers.includes(phoneNumber)) return;
    
    // Max 5 phone numbers
    if (selectedPhoneNumbers.length >= 5) {
      alert('Maximum 5 phone numbers can be selected');
      return;
    }
    
    const newNumbers = [...selectedPhoneNumbers, phoneNumber];
    setSelectedPhoneNumbers(newNumbers);
    // Update formData with comma-separated list
    handleChange('inboundNumber', newNumbers.join(','));
  };

  const handlePhoneNumberRemove = (phoneNumber: string) => {
    const newNumbers = selectedPhoneNumbers.filter(num => num !== phoneNumber);
    console.log('🗑️ Removing phone number:', phoneNumber);
    console.log('🗑️ New phone numbers array:', newNumbers);
    setSelectedPhoneNumbers(newNumbers);
    // Update formData with comma-separated list (or empty string if no numbers)
    const newValue = newNumbers.join(',');
    console.log('🗑️ Setting inboundNumber to:', newValue);
    handleChange('inboundNumber', newValue);
  };

  const handleManualPhoneAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.currentTarget;
      const phoneNumber = input.value.trim();
      if (phoneNumber) {
        handlePhoneNumberAdd(phoneNumber);
        input.value = '';
      }
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Completely prevent Enter key from doing anything in the form
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  const handleButtonClick = async () => {
    // Only allow submission on step 3
    if (step !== 3) {
      console.log('Button click prevented - not on step 3');
      return;
    }
    
    // Prevent double submission
    if (loading) {
      console.log('Button click prevented - already loading');
      return;
    }
    
    if (!formData.agentName?.trim()) {
      alert('Agent name is required');
      return;
    }

    console.log('💾 Submitting form with selectedPhoneNumbers:', selectedPhoneNumbers);
    console.log('💾 formData.inboundNumber before submit:', formData.inboundNumber);

    // Prepare payload with inboundNumbers as array (not inboundNumber as string)
    const payload = {
      ...formData,
      inboundNumbers: selectedPhoneNumbers, // GHL expects array
      inboundNumber: undefined, // Remove the string version
    };
    
    console.log('💾 Final payload with inboundNumbers array:', payload);

    setLoading(true);
    try {
      await onSubmit(payload);
      // Reset form and close modal on success
      setStep(1);
      onClose();
    } catch (error) {
      console.error('Error submitting voice agent:', error);
      alert('Failed to save voice agent. Please try again.');
    } finally {
      // Always stop loading, even if there's an error
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'create' ? 'Create Voice Agent' : 'Edit Voice Agent'}
      size="2xl"
    >
      <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleFormKeyDown} className="space-y-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 max-w-2xl mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step === s
                      ? 'bg-foreground text-background ring-4 ring-foreground/20 scale-110'
                      : step > s
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s
                  )}
                </div>
                <div className="text-center">
                  <div className={`text-xs font-medium whitespace-nowrap ${
                    step === s ? 'text-foreground' : step > s ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {s === 1 ? 'Agent Details' : s === 2 ? 'Agent Goals' : 'Settings'}
                  </div>
                </div>
              </div>
              {s < 3 && (
                <div className="w-24 h-0.5 mx-4 mb-6">
                  <div className={`h-full rounded-full transition-all ${
                    step > s ? 'bg-foreground' : 'bg-border'
                  }`} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Agent Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Agent Details</h3>
            <p className="text-sm text-muted-foreground mb-4">Customize your Agent according to your needs</p>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Agent Name *"
                type="text"
                value={formData.agentName || ''}
                onChange={(e) => handleChange('agentName', e.target.value)}
                placeholder="My Agent 352"
                maxLength={40}
                required
              />
              <Input
                label="Business Name"
                type="text"
                value={formData.businessName || ''}
                onChange={(e) => handleChange('businessName', e.target.value)}
                placeholder="Your Business Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Language"
                value={formData.language || 'en-US'}
                onChange={(e) => handleChange('language', e.target.value)}
                options={LANGUAGES}
              />

              <Select
                label="Voice"
                value={formData.voiceId || 'jessica'}
                onChange={(e) => handleChange('voiceId', e.target.value)}
                options={VOICES}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="LLM Model"
                value={formData.llmModel || 'gpt-4o'}
                onChange={(e) => handleChange('llmModel', e.target.value)}
                options={LLM_MODELS}
              />

              <Select
                label="Timezone"
                value={formData.timezone || 'America/New_York'}
                onChange={(e) => handleChange('timezone', e.target.value)}
                options={TIMEZONES}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Agent's Initial Message
              </label>
              <textarea
                value={formData.welcomeMessage || ''}
                onChange={(e) => handleChange('welcomeMessage', e.target.value)}
                placeholder="Hey, you have reached [Business Name]. How can I help you today?"
                rows={3}
                maxLength={190}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground bg-background text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {(formData.welcomeMessage?.length || 0)}/190 characters
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Agent Goals / Prompt */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Agent Goals</h3>
            <p className="text-sm text-muted-foreground mb-4">Set up Agent's personality and actions</p>

            {/* Knowledge Base Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Select knowledge base
                </label>
                <button 
                  type="button"
                  className="text-sm text-foreground hover:text-muted-foreground"
                  onClick={handleCreateKB}
                >
                  + Create New
                </button>
              </div>
              
              {loadingKBs ? (
                <div className="text-sm text-muted-foreground py-2">Loading knowledge bases...</div>
              ) : (
                <div className="space-y-2">
                  <Select
                    value={formData.knowledgeBaseId || ''}
                    onChange={(e) => handleChange('knowledgeBaseId', e.target.value)}
                    options={[
                      { value: '', label: 'Select knowledge base for this agent' },
                      ...knowledgeBases.map(kb => ({ value: kb.value, label: kb.label })),
                    ]}
                  />
                  
                  {/* Edit/Delete buttons when a KB is selected */}
                  {formData.knowledgeBaseId && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditKB(formData.knowledgeBaseId!)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteKB(formData.knowledgeBaseId!)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                  
                  {knowledgeBases.length === 0 && !loadingKBs && (
                    <p className="text-xs text-muted-foreground">
                      No knowledge bases found.{' '}
                      <button 
                        type="button" 
                        onClick={handleCreateKB}
                        className="text-foreground underline"
                      >
                        Create one
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Prompt
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    title="Custom Value"
                  >
                    ⚙️ Custom Value
                  </button>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    title="Evaluate"
                  >
                    📊 Evaluate
                  </button>
                </div>
              </div>
              <textarea
                value={formData.agentPrompt || ''}
                onChange={(e) => handleChange('agentPrompt', e.target.value)}
                placeholder="AGENT ROLE & OBJECTIVE:

Introduction: You are My Agent, a dedicated Customer Support Specialist at your company, focused on assisting clients.

Your Goal: Gather contact information and assist callers with their inquiries."
                className="w-full h-32 px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground"
              />
            </div>
          </div>
        )}

        {/* Step 3: Phone Number */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Phone Number</h3>
            <p className="text-sm text-muted-foreground mb-4">Select phone numbers for your agent (Max 5)</p>

            {/* Phone Number Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Phone numbers (Max 5) / Number pool (Max 1)
                </label>
                {phoneNumbers.length === 0 && !loadingPhones && (
                  <a
                    href="https://app.gohighlevel.com/v2/location/settings/phone-numbers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground hover:text-muted-foreground"
                  >
                    Buy New Number
                  </a>
                )}
              </div>

              {/* Selected Phone Numbers Display */}
              {selectedPhoneNumbers.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedPhoneNumbers.map((number) => (
                    <div
                      key={number}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-foreground text-background rounded-md text-sm"
                    >
                      <span>{number}</span>
                      <button
                        type="button"
                        onClick={() => handlePhoneNumberRemove(number)}
                        className="hover:bg-muted rounded-full p-0.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {loadingPhones ? (
                <div className="text-sm text-muted-foreground">Loading phone numbers...</div>
              ) : phoneNumbers.length > 0 && selectedPhoneNumbers.length < 5 ? (
                <>
                  <Select
                    label=""
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handlePhoneNumberAdd(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    options={[
                      { value: '', label: 'Select a phone number to add' },
                      ...phoneNumbers.filter(phone => !selectedPhoneNumbers.includes(phone.value)),
                    ]}
                  />
                </>
              ) : selectedPhoneNumbers.length >= 5 ? (
                <div className="text-sm text-muted-foreground bg-muted border border-border rounded-md p-3">
                  Maximum 5 phone numbers selected
                </div>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted border border-border rounded-md p-3">
                  No phone numbers available.{' '}
                  <a
                    href="https://app.gohighlevel.com/v2/location/settings/phone-numbers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-muted-foreground underline"
                  >
                    Buy a new number
                  </a>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                You can select up to 5 phone numbers OR 1 number pool for each agent. Maximum 5 phone numbers can be selected.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-border">
          <div>
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={prevStep}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleButtonClick}
                loading={loading}
                disabled={loading}
              >
                {mode === 'create' ? 'Create Agent' : 'Update Agent'}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Knowledge Base Modal */}
      {showKBModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setShowKBModal(false)}
            />
            <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">
                  {kbModalMode === 'create' ? 'Create Knowledge Base' : 'Edit Knowledge Base'}
                </h3>
                <button
                  onClick={() => setShowKBModal(false)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={kbFormData.name}
                    onChange={(e) => setKBFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Knowledge Base"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    value={kbFormData.description}
                    onChange={(e) => setKBFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description of this knowledge base..."
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                <Button type="button" variant="secondary" onClick={() => setShowKBModal(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSaveKB}
                  loading={savingKB}
                  disabled={savingKB || !kbFormData.name.trim()}
                >
                  {kbModalMode === 'create' ? 'Create' : 'Update'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}