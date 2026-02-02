'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardHeader, Input } from '@/components/ui';
import { ContactCard, ContactForm } from '@/components/contacts';
import { GHLContact, CreateContactPayload } from '@/types';
import { Plus, RefreshCw, Search } from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<GHLContact | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = search
        ? `/api/contacts?search=${encodeURIComponent(search)}`
        : '/api/contacts?limit=50';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchContacts();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchContacts]);

  const syncContacts = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('access_token');
      await fetch('/api/contacts/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchContacts();
    } catch (error) {
      console.error('Error syncing contacts:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateContact = async (data: CreateContactPayload) => {
    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to create contact');
    await fetchContacts();
  };

  const handleUpdateContact = async (data: CreateContactPayload) => {
    if (!editingContact) return;

    const token = localStorage.getItem('access_token');
    const res = await fetch(`/api/contacts/${editingContact.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to update contact');
    setEditingContact(null);
    await fetchContacts();
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete contact');
      await fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const handleEditContact = (contact: GHLContact) => {
    setEditingContact(contact);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">
            Manage your GoHighLevel contacts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={syncContacts} loading={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search contacts by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 text-black placeholder-gray-400"
            />
          </div>
        </div>
      </Card>

      {/* Contacts Grid */}
      <Card padding="none">
        <div className="p-6 border-b">
          <CardHeader
            title={`All Contacts (${contacts.length})`}
            description="Click on a contact to view details"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
            <p className="mt-4 text-gray-600">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">
              {search ? 'No contacts found matching your search.' : 'No contacts yet.'}
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first contact
            </Button>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={handleEditContact}
                onDelete={handleDeleteContact}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Create Form */}
      <ContactForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateContact}
        mode="create"
      />

      {/* Edit Form */}
      {editingContact && (
        <ContactForm
          isOpen={true}
          onClose={() => setEditingContact(null)}
          onSubmit={handleUpdateContact}
          initialData={{
            firstName: editingContact.firstName,
            lastName: editingContact.lastName,
            email: editingContact.email,
            phone: editingContact.phone,
            companyName: editingContact.companyName,
          }}
          mode="edit"
        />
      )}
    </div>
  );
}
