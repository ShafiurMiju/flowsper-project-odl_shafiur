'use client';

import { GHLContact } from '@/types';
import { Mail, Phone, Building2, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface ContactCardProps {
  contact: GHLContact;
  onEdit: (contact: GHLContact) => void;
  onDelete: (contactId: string) => void;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const displayName =
    `${contact.firstName || ''} ${contact.lastName || ''}`.trim() ||
    contact.email ||
    'Unknown Contact';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {displayName}
          </h3>

          <div className="mt-2 space-y-1">
            {contact.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.companyName && (
              <div className="flex items-center text-sm text-gray-600">
                <Building2 className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="truncate">{contact.companyName}</span>
              </div>
            )}
          </div>

          {contact.tags && contact.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {contact.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
              {contact.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{contact.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(contact)}
            className="p-2"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(contact.id)}
            className="p-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
