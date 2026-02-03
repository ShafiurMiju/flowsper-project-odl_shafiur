'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { CreateVoiceActionPayload, VoiceActionType } from '@/types';

interface VoiceActionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVoiceActionPayload) => Promise<void>;
  agentId: string;
  initialData?: Partial<CreateVoiceActionPayload & { id: string }>;
  mode: 'create' | 'edit';
}

const ACTION_TYPES: { value: VoiceActionType; label: string; description: string }[] = [
  { value: 'CALL_TRANSFER', label: 'Call Transfer', description: 'Transfer the call to another number or user' },
  { value: 'SMS', label: 'Send SMS', description: 'Send an SMS message during or after the call' },
  { value: 'WORKFLOW_TRIGGER', label: 'Trigger Workflow', description: 'Trigger a GHL workflow' },
  { value: 'DATA_EXTRACTION', label: 'Data Extraction', description: 'Extract data from the conversation' },
  { value: 'IN_CALL_DATA_EXTRACTION', label: 'In-Call Data Extraction', description: 'Extract data during the call' },
  { value: 'APPOINTMENT_BOOKING', label: 'Book Appointment', description: 'Book an appointment' },
  { value: 'CUSTOM_ACTION', label: 'Custom Action', description: 'Trigger a custom webhook' },
  { value: 'KNOWLEDGE_BASE', label: 'Knowledge Base', description: 'Query a knowledge base' },
];

export function VoiceActionForm({
  isOpen,
  onClose,
  onSubmit,
  agentId,
  initialData,
  mode,
}: VoiceActionFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateVoiceActionPayload>({
    agentId,
    actionType: 'CALL_TRANSFER',
    name: '',
    actionParameters: {
      triggerPrompt: '',
      triggerMessage: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        agentId,
      }));
    } else {
      setFormData({
        agentId,
        actionType: 'CALL_TRANSFER',
        name: '',
        actionParameters: {
          triggerPrompt: '',
          triggerMessage: '',
        },
      });
    }
  }, [initialData, agentId]);

  const handleChange = (field: keyof CreateVoiceActionPayload, value: string | VoiceActionType | Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleParamChange = (field: string, value: string | boolean | undefined) => {
    setFormData((prev) => ({
      ...prev,
      actionParameters: {
        ...prev.actionParameters,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      alert('Action name is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting action:', error);
      alert('Failed to save action');
    } finally {
      setLoading(false);
    }
  };

  const renderActionParameters = () => {
    switch (formData.actionType) {
      case 'CALL_TRANSFER':
        return (
          <>
            <Select
              label="Transfer To Type"
              value={formData.actionParameters?.transferToType || 'number'}
              onChange={(e) => handleParamChange('transferToType', e.target.value)}
              options={[
                { value: 'number', label: 'Phone Number' },
                { value: 'user', label: 'User' },
                { value: 'queue', label: 'Queue' },
              ]}
            />
            <Input
              label="Transfer To Value"
              type="text"
              value={formData.actionParameters?.transferToValue || ''}
              onChange={(e) => handleParamChange('transferToValue', e.target.value)}
              placeholder={formData.actionParameters?.transferToType === 'number' ? '+1234567890' : 'User or Queue ID'}
            />
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={formData.actionParameters?.hearWhisperMessage || false}
                onChange={(e) => handleParamChange('hearWhisperMessage', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Hear whisper message before transfer</span>
            </label>
          </>
        );

      case 'SMS':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SMS Template
            </label>
            <textarea
              value={formData.actionParameters?.smsTemplate || ''}
              onChange={(e) => handleParamChange('smsTemplate', e.target.value)}
              placeholder="Enter SMS message template..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        );

      case 'WORKFLOW_TRIGGER':
        return (
          <Input
            label="Workflow ID"
            type="text"
            value={formData.actionParameters?.workflowId || ''}
            onChange={(e) => handleParamChange('workflowId', e.target.value)}
            placeholder="Enter workflow ID..."
          />
        );

      case 'APPOINTMENT_BOOKING':
        return (
          <Input
            label="Calendar ID"
            type="text"
            value={formData.actionParameters?.calendarId || ''}
            onChange={(e) => handleParamChange('calendarId', e.target.value)}
            placeholder="Enter calendar ID..."
          />
        );

      case 'CUSTOM_ACTION':
        return (
          <Input
            label="Webhook URL"
            type="url"
            value={formData.actionParameters?.webhookUrl || ''}
            onChange={(e) => handleParamChange('webhookUrl', e.target.value)}
            placeholder="https://your-webhook-url.com"
          />
        );

      case 'KNOWLEDGE_BASE':
        return (
          <Input
            label="Knowledge Base ID"
            type="text"
            value={formData.actionParameters?.knowledgeBaseId || ''}
            onChange={(e) => handleParamChange('knowledgeBaseId', e.target.value)}
            placeholder="Enter knowledge base ID..."
          />
        );

      default:
        return null;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'create' ? 'Create Action' : 'Edit Action'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Action Name *"
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Transfer to Manager"
          required
        />

        <Select
          label="Action Type"
          value={formData.actionType}
          onChange={(e) => handleChange('actionType', e.target.value as VoiceActionType)}
          options={ACTION_TYPES.map(t => ({ value: t.value, label: t.label }))}
        />

        <p className="text-sm text-gray-500">
          {ACTION_TYPES.find(t => t.value === formData.actionType)?.description}
        </p>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Trigger Settings</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Prompt
              </label>
              <textarea
                value={formData.actionParameters?.triggerPrompt || ''}
                onChange={(e) => handleParamChange('triggerPrompt', e.target.value)}
                placeholder="When the caller asks to speak to a manager..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Message
              </label>
              <textarea
                value={formData.actionParameters?.triggerMessage || ''}
                onChange={(e) => handleParamChange('triggerMessage', e.target.value)}
                placeholder="Let me transfer you to a manager right away..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Action Parameters</h4>
          <div className="space-y-4">
            {renderActionParameters()}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {mode === 'create' ? 'Create Action' : 'Update Action'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
