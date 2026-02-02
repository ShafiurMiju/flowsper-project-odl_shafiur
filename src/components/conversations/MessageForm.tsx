import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';
import { CreateMessagePayload, GHLContact } from '@/types';

interface MessageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMessagePayload) => Promise<void>;
  contacts: GHLContact[];
  initialContactId?: string;
  conversationId?: string;
}

export function MessageForm({
  isOpen,
  onClose,
  onSubmit,
  contacts,
  initialContactId,
  conversationId,
}: MessageFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateMessagePayload>({
    type: 'SMS',
    contactId: initialContactId || '',
    message: '',
    conversationId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      setFormData({
        type: 'SMS',
        contactId: initialContactId || '',
        message: '',
        conversationId,
      });
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Message">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Message Type"
          value={formData.type}
          onChange={(e) =>
            setFormData({ ...formData, type: e.target.value as CreateMessagePayload['type'] })
          }
          options={[
            { value: 'SMS', label: 'SMS' },
            { value: 'Email', label: 'Email' },
            { value: 'WhatsApp', label: 'WhatsApp' },
          ]}
          required
        />

        {!conversationId && (
          <Select
            label="Contact"
            value={formData.contactId}
            onChange={(e) =>
              setFormData({ ...formData, contactId: e.target.value })
            }
            options={contacts.map((contact) => ({
              value: contact.id,
              label: `${contact.firstName || ''} ${contact.lastName || ''} ${
                contact.email ? `(${contact.email})` : ''
              }`.trim(),
            }))}
            required
          />
        )}

        {formData.type === 'Email' && (
          <Input
            label="Subject"
            type="text"
            value={formData.subject || ''}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            required={formData.type === 'Email'}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Message
          </label>
          <textarea
            value={formData.message || ''}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            rows={formData.type === 'Email' ? 10 : 4}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={
              formData.type === 'Email'
                ? 'Enter your email message...'
                : 'Enter your message...'
            }
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Send Message
          </Button>
        </div>
      </form>
    </Modal>
  );
}
