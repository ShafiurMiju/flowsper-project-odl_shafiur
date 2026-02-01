'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardHeader, Select } from '@/components/ui';
import { OpportunityCard, OpportunityForm } from '@/components/opportunities';
import {
  GHLOpportunity,
  GHLPipeline,
  GHLContact,
  CreateOpportunityPayload,
} from '@/types';
import { Plus, RefreshCw } from 'lucide-react';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] =
    useState<GHLOpportunity | null>(null);

  const fetchPipelines = async () => {
    try {
      const res = await fetch('/api/pipelines');
      const data = await res.json();
      setPipelines(data.pipelines || []);
      if (data.pipelines?.length > 0 && !selectedPipeline) {
        setSelectedPipeline(data.pipelines[0].id);
      }
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts?limit=100');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedPipeline
        ? `/api/opportunities?pipelineId=${selectedPipeline}&limit=50`
        : '/api/opportunities?limit=50';
      const res = await fetch(url);
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPipeline]);

  useEffect(() => {
    fetchPipelines();
    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedPipeline) {
      fetchOpportunities();
    }
  }, [selectedPipeline, fetchOpportunities]);

  const syncOpportunities = async () => {
    setSyncing(true);
    try {
      await fetch('/api/opportunities/sync', { method: 'POST' });
      await fetchOpportunities();
    } catch (error) {
      console.error('Error syncing opportunities:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateOpportunity = async (data: CreateOpportunityPayload) => {
    const res = await fetch('/api/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to create opportunity');
    await fetchOpportunities();
  };

  const handleUpdateOpportunity = async (data: CreateOpportunityPayload) => {
    if (!editingOpportunity) return;

    const res = await fetch(`/api/opportunities/${editingOpportunity.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to update opportunity');
    setEditingOpportunity(null);
    await fetchOpportunities();
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete opportunity');
      await fetchOpportunities();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
    }
  };

  const handleMoveOpportunity = async (
    opportunityId: string,
    newStageId: string
  ) => {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineStageId: newStageId }),
      });

      if (!res.ok) throw new Error('Failed to move opportunity');
      await fetchOpportunities();
    } catch (error) {
      console.error('Error moving opportunity:', error);
    }
  };

  const handleEditOpportunity = (opportunity: GHLOpportunity) => {
    setEditingOpportunity(opportunity);
  };

  const currentPipeline = pipelines.find((p) => p.id === selectedPipeline);

  // Group opportunities by stage
  const opportunitiesByStage = currentPipeline?.stages.reduce(
    (acc, stage) => {
      acc[stage.id] = opportunities.filter(
        (opp) => opp.pipelineStageId === stage.id
      );
      return acc;
    },
    {} as Record<string, GHLOpportunity[]>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-600 mt-1">
            Manage your sales pipeline and deals
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={syncOpportunities} loading={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Opportunity
          </Button>
        </div>
      </div>

      {/* Pipeline Selector */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Select
            label="Pipeline"
            value={selectedPipeline}
            onChange={(e) => setSelectedPipeline(e.target.value)}
            options={pipelines.map((p) => ({ value: p.id, label: p.name }))}
            className="max-w-xs"
          />
          <div className="text-sm text-gray-600 mt-6">
            {opportunities.length} opportunities in this pipeline
          </div>
        </div>
      </Card>

      {/* Pipeline Board */}
      {loading ? (
        <Card>
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
            <p className="mt-4 text-gray-600">Loading opportunities...</p>
          </div>
        </Card>
      ) : !currentPipeline ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-600">No pipelines found. Create one in GoHighLevel first.</p>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {currentPipeline.stages.map((stage) => {
              const stageOpportunities = opportunitiesByStage?.[stage.id] || [];
              const stageValue = stageOpportunities.reduce(
                (sum, opp) => sum + (opp.monetaryValue || 0),
                0
              );

              return (
                <div
                  key={stage.id}
                  className="w-80 bg-gray-100 rounded-lg p-4 flex-shrink-0"
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {stage.name}
                      </h3>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {stageOpportunities.length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      ${stageValue.toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {stageOpportunities.map((opportunity) => (
                      <OpportunityCard
                        key={opportunity.id}
                        opportunity={opportunity}
                        pipeline={currentPipeline}
                        onEdit={handleEditOpportunity}
                        onDelete={handleDeleteOpportunity}
                        onMove={handleMoveOpportunity}
                      />
                    ))}

                    {stageOpportunities.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No opportunities
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Form */}
      <OpportunityForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateOpportunity}
        mode="create"
        pipelines={pipelines}
        contacts={contacts}
      />

      {/* Edit Form */}
      {editingOpportunity && (
        <OpportunityForm
          isOpen={true}
          onClose={() => setEditingOpportunity(null)}
          onSubmit={handleUpdateOpportunity}
          initialData={{
            name: editingOpportunity.name,
            monetaryValue: editingOpportunity.monetaryValue,
            pipelineId: editingOpportunity.pipelineId,
            pipelineStageId: editingOpportunity.pipelineStageId,
            contactId: editingOpportunity.contactId,
            status: editingOpportunity.status,
          }}
          mode="edit"
          pipelines={pipelines}
          contacts={contacts}
        />
      )}
    </div>
  );
}
