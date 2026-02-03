'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card, CardHeader, Input, PageLoader, SkeletonCard } from '@/components/ui';
import { ContactCard, ContactForm } from '@/components/contacts';
import { GHLContact, CreateContactPayload } from '@/types';
import { Plus, RefreshCw, Search, Download, Upload, Users, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<GHLContact | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setCurrentPage(1);
    try {
      const token = localStorage.getItem('access_token');
      const url = search
        ? `/api/contacts?search=${encodeURIComponent(search)}`
        : '/api/contacts';
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

  const handleExportContacts = () => {
    if (contacts.length === 0) {
      alert('No contacts to export');
      return;
    }

    // Prepare CSV data
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Tags', 'Source'];
    const csvRows = [
      headers.join(','),
      ...contacts.map((contact) =>
        [
          contact.firstName || '',
          contact.lastName || '',
          contact.email || '',
          contact.phone || '',
          contact.companyName || '',
          (contact.tags || []).join(';'),
          contact.source || '',
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`) // Escape quotes
          .join(',')
      ),
    ];

    // Create and download file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportContacts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter((row) => row.trim());
        
        if (rows.length < 2) {
          alert('CSV file is empty or invalid');
          return;
        }

        // Skip header row
        const dataRows = rows.slice(1);
        const token = localStorage.getItem('access_token');
        let successCount = 0;
        let errorCount = 0;

        for (const row of dataRows) {
          // Parse CSV row (simple parser - handles quoted fields)
          const fields = row.match(/("[^"]*"|[^,]+)/g)?.map((field) =>
            field.replace(/^"|"$/g, '').replace(/""/g, '"')
          ) || [];

          const [firstName, lastName, email, phone, companyName, tagsStr, source] = fields;

          if (!email && !phone) {
            errorCount++;
            continue; // Skip rows without email or phone
          }

          try {
            const contactData: CreateContactPayload = {
              firstName: firstName?.trim() || undefined,
              lastName: lastName?.trim() || undefined,
              email: email?.trim() || undefined,
              phone: phone?.trim() || undefined,
              companyName: companyName?.trim() || undefined,
              tags: tagsStr ? tagsStr.split(';').map((t) => t.trim()).filter(Boolean) : undefined,
              source: source?.trim() || 'imported',
            };

            const res = await fetch('/api/contacts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(contactData),
            });

            if (res.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }

        alert(`Import complete!\nSuccess: ${successCount}\nFailed: ${errorCount}`);
        await fetchContacts();
      } catch (error) {
        console.error('Error importing contacts:', error);
        alert('Failed to import contacts. Please check the file format.');
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-background" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
            <p className="text-muted-foreground">
              Manage your GoHighLevel contacts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="secondary" 
            onClick={handleExportContacts}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportContacts}
            className="hidden"
          />
          <Button 
            variant="secondary" 
            onClick={syncContacts} 
            loading={syncing}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
            Sync
          </Button>
          <Button 
            onClick={() => setShowForm(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="border-border/50 shadow-sm">
        <div className="px-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search contacts by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Contacts Grid */}
      <Card padding="none" className="border-border/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">All Contacts</h3>
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading...' : `${contacts.length} contacts found`}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {search ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search 
                ? 'Try adjusting your search terms.' 
                : 'Get started by creating your first contact.'}
            </p>
            {!search && (
              <Button 
                onClick={() => setShowForm(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create your first contact
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border/50">
                  {contacts
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((contact) => (
                      <tr key={contact.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center mr-3 font-semibold text-sm">
                              {(contact.firstName?.[0] || 'U').toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {contact.firstName && contact.lastName
                                  ? `${contact.firstName} ${contact.lastName}`
                                  : contact.firstName || contact.lastName || 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">{contact.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">{contact.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground">{contact.companyName || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1 flex-wrap">
                            {(contact.tags || []).slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                            {(contact.tags || []).length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-muted-foreground">
                                +{(contact.tags || []).length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditContact(contact)}
                              className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteContact(contact.id)}
                              className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
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

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.ceil(contacts.length / itemsPerPage)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(Math.ceil(contacts.length / itemsPerPage), p + 1)
                      )
                    }
                    disabled={currentPage >= Math.ceil(contacts.length / itemsPerPage)}
                    className="px-3 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
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
