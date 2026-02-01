'use client';

import { useState } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { CreateContactPayload } from '@/types';

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContactPayload) => Promise<void>;
  initialData?: Partial<CreateContactPayload>;
  mode: 'create' | 'edit';
}

export function ContactForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateContactPayload>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    companyName: initialData?.companyName || '',
    source: initialData?.source || 'dataflow-crm',
  });

  const handleChange = (field: keyof CreateContactPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyName: '',
        source: 'dataflow-crm',
      });
    } catch (error) {
      console.error('Error submitting contact:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create Contact' : 'Edit Contact'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="John"
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Doe"
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="john@example.com"
        />

        <Input
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+1 (555) 000-0000"
        />

        <Input
          label="Company"
          value={formData.companyName}
          onChange={(e) => handleChange('companyName', e.target.value)}
          placeholder="Acme Inc."
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {mode === 'create' ? 'Create Contact' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
