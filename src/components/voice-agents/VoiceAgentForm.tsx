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
}: VoiceAgentFormProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [phoneNumbers, setPhoneNumbers] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingPhones, setLoadingPhones] = useState(false);
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

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Fetch phone numbers when reaching step 3
  useEffect(() => {
    if (isOpen && step === 3 && phoneNumbers.length === 0) {
      fetchPhoneNumbers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isOpen]);

  const fetchPhoneNumbers = async () => {
    setLoadingPhones(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/phone-numbers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.phoneNumbers && data.phoneNumbers.length > 0) {
        const numbers = data.phoneNumbers.map((phone: { phoneNumber: string; friendlyName?: string }) => ({
          value: phone.phoneNumber,
          label: phone.friendlyName || phone.phoneNumber,
        }));
        setPhoneNumbers(numbers);
      } else {
        setPhoneNumbers([]);
      }
    } catch (error) {
      console.error('Failed to fetch phone numbers:', error);
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
    
    if (!formData.agentName?.trim()) {
      alert('Agent name is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
      setStep(1);
    } catch (error) {
      console.error('Error submitting voice agent:', error);
      alert('Failed to save voice agent');
    } finally {
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
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              <span className={`ml-2 text-sm ${step >= s ? 'text-blue-400' : 'text-gray-300'}`}>
                {s === 1 ? 'Agent Details' : s === 2 ? 'Agent Goals' : 'Settings'}
              </span>
              {s < 3 && <div className="w-8 h-0.5 mx-2 bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Step 1: Agent Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Agent Details</h3>
            <p className="text-sm text-gray-300 mb-4">Customize your Agent according to your needs</p>

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
              <label className="block text-sm font-medium text-white mb-1">
                Agent's Initial Message
              </label>
              <textarea
                value={formData.welcomeMessage || ''}
                onChange={(e) => handleChange('welcomeMessage', e.target.value)}
                placeholder="Hey, you have reached [Business Name]. How can I help you today?"
                rows={3}
                maxLength={190}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white bg-gray-800"
              />
              <p className="text-xs text-gray-400 mt-1">
                {(formData.welcomeMessage?.length || 0)}/190 characters
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Agent Goals / Prompt */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Agent Goals</h3>
            <p className="text-sm text-gray-300 mb-4">Set up Agent's personality and actions</p>

            {/* Knowledge Base Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-white">
                  Select knowledge base
                </label>
                <a 
                  href="#" 
                  className="text-sm text-blue-400 hover:text-blue-300"
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Open knowledge base creation modal
                    alert('Create New Knowledge Base - Feature coming soon');
                  }}
                >
                  Create New ↗
                </a>
              </div>
              <Select
                value={formData.knowledgeBaseId || ''}
                onChange={(e) => handleChange('knowledgeBaseId', e.target.value)}
                options={[
                  { value: '', label: 'Select knowledge base for this agent' },
                  { value: 'kb1', label: 'Customer Support KB' },
                  { value: 'kb2', label: 'Product Information KB' },
                  { value: 'kb3', label: 'FAQ Database' },
                ]}
              />
            </div>

            {/* Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-white">
                  Prompt
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-sm text-gray-400 hover:text-gray-300"
                    title="Custom Value"
                  >
                    ⚙️ Custom Value
                  </button>
                  <button
                    type="button"
                    className="text-sm text-gray-400 hover:text-gray-300"
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

Introduction: You are My Agent 508, a dedicated Customer Support Specialist at 'Octopi Digital', focused on assisting my clients.

Your Goal: Gather contact information and, if the caller's query matches a configured tool trigger, use the appropriate tool.


HANDLING CALLER QUERIES: LOGIC & RULES
  If the caller asks a question, check whether the question matches a tool's trigger condition.
  1. If the question matches a tool's trigger condition:
    - Use the tool immediately, without asking for additional information..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white bg-gray-800 font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  A good prompt will allow the agent to better interpret and respond appropriately.
                  <a href="#" className="text-blue-400 hover:text-blue-300 ml-1">
                    Prompt Guidelines
                  </a>
                  <a href="#" className="text-blue-400 hover:text-blue-300 ml-2">
                    View System Prompts
                  </a>
                </p>
                <p className="text-xs text-gray-400">
                  {(formData.agentPrompt?.length || 0)} tokens
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Phone & Settings */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Phone & Availability</h3>
            <p className="text-sm text-gray-300 mb-4">Select phone numbers/number pool and define working hours for your Agent</p>

            {/* Phone Numbers Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-white">
                  Phone numbers (Max 5) / Number pool (Max 1)
                </label>
                {phoneNumbers.length === 0 && !loadingPhones && (
                  <a
                    href="https://app.gohighlevel.com/v2/location/settings/phone-numbers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Buy New Number
                  </a>
                )}
              </div>
              {loadingPhones ? (
                <div className="text-sm text-gray-400">Loading phone numbers...</div>
              ) : phoneNumbers.length > 0 ? (
                <>
                  <Select
                    label=""
                    value={formData.inboundNumber || ''}
                    onChange={(e) => handleChange('inboundNumber', e.target.value)}
                    options={[
                      { value: '', label: 'Please select' },
                      ...phoneNumbers,
                    ]}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Or enter manually below
                  </p>
                </>
              ) : (
                <div className="text-sm text-gray-400 bg-gray-800 border border-gray-700 rounded-md p-3">
                  No phone numbers available.{' '}
                  <a
                    href="https://app.gohighlevel.com/v2/location/settings/phone-numbers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Buy a new number
                  </a>
                  {' '}or enter manually below.
                </div>
              )}
              
              {/* Manual phone number input */}
              <div className="mt-3">
                <Input
                  label="Or Enter Phone Number Manually"
                  type="tel"
                  value={formData.inboundNumber || ''}
                  onChange={(e) => handleChange('inboundNumber', e.target.value)}
                  placeholder="+1234567890"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter phone number with country code (e.g., +1234567890)
                </p>
              </div>
              
              <p className="text-xs text-gray-400 mt-2">
                You can select up to 5 phone numbers OR 1 number pool for each agent. Maximum 5 phone numbers can be selected.
              </p>
            </div>

            {/* Enable AI Agent as backup */}
            <div className="border-t border-gray-700 pt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!formData.isAgentAsBackupDisabled}
                  onChange={(e) => handleChange('isAgentAsBackupDisabled', !e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-white">
                    Enable AI Agent as a backup to the phone number/number pool
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    AI Agent will answer the call if the user or call forwarding number doesn't respond
                  </p>
                </div>
              </label>
            </div>

            {/* Working Hours Toggle */}
            <div className="border-t border-gray-700 pt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => {}}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-white">
                    Set working hours for the agent
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    The agent is active 24x7
                  </p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Patience Level"
                value={formData.patienceLevel || 'high'}
                onChange={(e) => handleChange('patienceLevel', e.target.value)}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
              />

              <Input
                label="Max Call Duration (seconds)"
                type="number"
                value={formData.maxCallDuration || 300}
                onChange={(e) => handleChange('maxCallDuration', parseInt(e.target.value))}
                min={180}
                max={900}
              />
            </div>

            {/* Idle Reminders */}
            <div className="border-t border-gray-700 pt-4">
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={formData.sendUserIdleReminders}
                  onChange={(e) => handleChange('sendUserIdleReminders', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-white">Send user idle reminders</span>
              </label>

              {formData.sendUserIdleReminders && (
                <Input
                  label="Reminder After Idle Time (seconds)"
                  type="number"
                  value={formData.reminderAfterIdleTimeSeconds || 8}
                  onChange={(e) => handleChange('reminderAfterIdleTimeSeconds', parseInt(e.target.value))}
                  min={1}
                  max={20}
                />
              )}
            </div>

            {/* Backup Agent */}
            <div className="border-t border-gray-700 pt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!formData.isAgentAsBackupDisabled}
                  onChange={(e) => handleChange('isAgentAsBackupDisabled', !e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-white">
                  Enable AI Agent as a backup to the phone number
                </span>
              </label>
              <p className="text-xs text-gray-400 mt-1 ml-6">
                AI Agent will answer the call if the user or call forwarding number doesn't respond
              </p>
            </div>

            {/* Translation */}
            <div className="border-t border-gray-700 pt-4">
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={formData.translation?.enabled || false}
                  onChange={(e) => handleTranslationChange('enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-white">Enable Translation</span>
              </label>

              {formData.translation?.enabled && (
                <Select
                  label="Translation Language"
                  value={formData.translation?.language || 'es'}
                  onChange={(e) => handleTranslationChange('language', e.target.value)}
                  options={[
                    { value: 'es', label: 'Spanish' },
                    { value: 'fr', label: 'French' },
                    { value: 'de', label: 'German' },
                    { value: 'it', label: 'Italian' },
                    { value: 'pt', label: 'Portuguese' },
                  ]}
                />
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-gray-700">
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
              <Button type="submit" loading={loading}>
                {mode === 'create' ? 'Create Agent' : 'Update Agent'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}