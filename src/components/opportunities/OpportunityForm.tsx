'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { CreateOpportunityPayload, GHLPipeline, GHLContact } from '@/types';

interface OpportunityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOpportunityPayload) => Promise<void>;
  initialData?: Partial<CreateOpportunityPayload>;
  mode: 'create' | 'edit';
  pipelines: GHLPipeline[];
  contacts: GHLContact[];
}

export function OpportunityForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  pipelines,
  contacts,
}: OpportunityFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOpportunityPayload>({
    name: initialData?.name || '',
    monetaryValue: initialData?.monetaryValue || 0,
    pipelineId: initialData?.pipelineId || '',
    pipelineStageId: initialData?.pipelineStageId || '',
    contactId: initialData?.contactId || '',
    status: initialData?.status || 'open',
  });

  // Get stages for selected pipeline
  const selectedPipeline = pipelines.find((p) => p.id === formData.pipelineId);
  const stages = selectedPipeline?.stages || [];

  // Set default pipeline and stage when pipelines load
  useEffect(() => {
    if (pipelines.length > 0 && !formData.pipelineId) {
      const firstPipeline = pipelines[0];
      setFormData((prev) => ({
        ...prev,
        pipelineId: firstPipeline.id,
        pipelineStageId: firstPipeline.stages[0]?.id || '',
      }));
    }
  }, [pipelines, formData.pipelineId]);

  const handleChange = (
    field: keyof CreateOpportunityPayload,
    value: string | number
  ) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Reset stage when pipeline changes
      if (field === 'pipelineId') {
        const pipeline = pipelines.find((p) => p.id === value);
        newData.pipelineStageId = pipeline?.stages[0]?.id || '';
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting opportunity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create Opportunity' : 'Edit Opportunity'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Opportunity Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="New deal with Acme"
          required
        />

        <Input
          label="Value ($)"
          type="number"
          value={formData.monetaryValue}
          onChange={(e) => handleChange('monetaryValue', parseFloat(e.target.value) || 0)}
          placeholder="10000"
        />

        <Select
          label="Pipeline"
          value={formData.pipelineId}
          onChange={(e) => handleChange('pipelineId', e.target.value)}
          options={pipelines.map((p) => ({ value: p.id, label: p.name }))}
        />

        <Select
          label="Stage"
          value={formData.pipelineStageId}
          onChange={(e) => handleChange('pipelineStageId', e.target.value)}
          options={stages.map((s) => ({ value: s.id, label: s.name }))}
        />

        <Select
          label="Contact"
          value={formData.contactId}
          onChange={(e) => handleChange('contactId', e.target.value)}
          options={[
            { value: '', label: 'Select a contact...' },
            ...contacts.map((c) => ({
              value: c.id,
              label:
                `${c.firstName || ''} ${c.lastName || ''}`.trim() ||
                c.email ||
                'Unknown',
            })),
          ]}
        />

        {mode === 'edit' && (
          <Select
            label="Status"
            value={formData.status || 'open'}
            onChange={(e) =>
              handleChange(
                'status',
                e.target.value as 'open' | 'won' | 'lost' | 'abandoned'
              )
            }
            options={[
              { value: 'open', label: 'Open' },
              { value: 'won', label: 'Won' },
              { value: 'lost', label: 'Lost' },
              { value: 'abandoned', label: 'Abandoned' },
            ]}
          />
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {mode === 'create' ? 'Create Opportunity' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
