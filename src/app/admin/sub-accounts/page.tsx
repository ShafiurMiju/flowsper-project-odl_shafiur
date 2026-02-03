'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context';
import { Button, Input, Card, Modal } from '@/components/ui';
import { Plus, Edit, Trash2, Eye, EyeOff, Users } from 'lucide-react';
import { DBSubAccount } from '@/types';

export default function SubAccountsPage() {
  const { user, isLoading: authLoading, isAdmin, subAccounts, refreshSubAccounts, switchSubAccount, activeSubAccount } = useAuth();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<DBSubAccount | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    ghl_location_id: '',
    ghl_api_key: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [authLoading, user, isAdmin, router]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch('/api/sub-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create sub-account');
        return;
      }

      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', ghl_location_id: '', ghl_api_key: '' });
      refreshSubAccounts();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setError('');
    setIsSubmitting(true);

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/sub-accounts/${editingAccount.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          ghl_location_id: formData.ghl_location_id,
          ghl_api_key: formData.ghl_api_key || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update sub-account');
        return;
      }

      setShowEditModal(false);
      setEditingAccount(null);
      setFormData({ name: '', email: '', password: '', ghl_location_id: '', ghl_api_key: '' });
      refreshSubAccounts();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (subAccountId: string) => {
    if (!confirm('Are you sure you want to delete this sub-account? This will also delete all associated contacts and opportunities.')) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/sub-accounts/${subAccountId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        refreshSubAccounts();
      }
    } catch (error) {
      console.error('Error deleting sub-account:', error);
    }
  };

  const openEditModal = (account: DBSubAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      email: '',
      password: '',
      ghl_location_id: account.ghl_location_id,
      ghl_api_key: '',
    });
    setShowEditModal(true);
  };

  const toggleApiKeyVisibility = (accountId: string) => {
    setShowApiKeys((prev) => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6" />
            Sub-Accounts
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage GHL sub-accounts and their access
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Sub-Account
        </Button>
      </div>

      {/* Active Sub-Account Indicator */}
      {activeSubAccount && (
        <Card className="border-foreground/30 bg-foreground/5">
          <div className="p-6">
            <p className="text-foreground">
              <strong>Currently viewing:</strong> {activeSubAccount.name}
              <Button
                variant="ghost"
                size="sm"
                className="ml-4"
                onClick={() => switchSubAccount(null)}
              >
                View All
              </Button>
            </p>
          </div>
        </Card>
      )}

      {/* Sub-Accounts List */}
        <div className="grid gap-4">
          {subAccounts.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-gray-400">No sub-accounts yet. Create one to get started.</p>
            </Card>
          ) : (
            subAccounts.map((account) => (
              <Card key={account.id} className="hover:border-gray-600 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-gray-400">
                        <span className="font-medium">Location ID:</span> {account.ghl_location_id}
                      </p>
                      <p className="text-gray-400 flex items-center gap-2">
                        <span className="font-medium">API Key:</span>
                        {showApiKeys[account.id] ? account.ghl_api_key : '••••••••••••••••'}
                        <button
                          onClick={() => toggleApiKeyVisibility(account.id)}
                          className="text-gray-500 hover:text-gray-300"
                        >
                          {showApiKeys[account.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </p>
                      <p className="text-gray-400">
                        <span className="font-medium">Status:</span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${account.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => switchSubAccount(account.id)}
                    >
                      Switch
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(account)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setError('');
            setFormData({ name: '', email: '', password: '', ghl_location_id: '', ghl_api_key: '' });
          }}
          title="Add Sub-Account"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Account Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Corp"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Login Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">This email will be used to login</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Login Password
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                GHL Location ID
              </label>
              <Input
                value={formData.ghl_location_id}
                onChange={(e) => setFormData({ ...formData, ghl_location_id: e.target.value })}
                placeholder="e.g., abc123xyz"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                GHL API Key
              </label>
              <Input
                value={formData.ghl_api_key}
                onChange={(e) => setFormData({ ...formData, ghl_api_key: e.target.value })}
                placeholder="Enter API key"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Sub-Account'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingAccount(null);
            setError('');
          }}
          title="Edit Sub-Account"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Account Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Corp"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                GHL Location ID
              </label>
              <Input
                value={formData.ghl_location_id}
                onChange={(e) => setFormData({ ...formData, ghl_location_id: e.target.value })}
                placeholder="e.g., abc123xyz"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                GHL API Key (leave empty to keep current)
              </label>
              <Input
                value={formData.ghl_api_key}
                onChange={(e) => setFormData({ ...formData, ghl_api_key: e.target.value })}
                placeholder="Enter new API key or leave empty"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAccount(null);
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
    </div>
  );
}
