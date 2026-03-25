'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardHeader, Select, SkeletonCard } from '@/components/ui';
import { OpportunityCard, OpportunityForm } from '@/components/opportunities';
import {
  GHLOpportunity,
  GHLPipeline,
  GHLContact,
  CreateOpportunityPayload,
} from '@/types';
import { Plus, Target, TrendingUp, Kanban } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] =
    useState<GHLOpportunity | null>(null);
  const [draggedOpportunity, setDraggedOpportunity] = useState<GHLOpportunity | null>(null);

  const fetchPipelines = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/pipelines', {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/contacts?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = selectedPipeline
        ? `/api/opportunities?pipelineId=${selectedPipeline}&limit=50`
        : '/api/opportunities?limit=50';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const handleCreateOpportunity = async (data: CreateOpportunityPayload) => {
    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/opportunities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to create opportunity');
    await fetchOpportunities();
  };

  const handleUpdateOpportunity = async (data: CreateOpportunityPayload) => {
    if (!editingOpportunity) return;

    const token = localStorage.getItem('access_token');
    const res = await fetch(`/api/opportunities/${editingOpportunity.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to update opportunity');
    setEditingOpportunity(null);
    await fetchOpportunities();
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pipelineStageId: newStageId }),
      });

      if (!res.ok) throw new Error('Failed to move opportunity');
      await fetchOpportunities();
    } catch (error) {
      console.error('Error moving opportunity:', error);
    }
  };

  const handleDragStart = (opportunity: GHLOpportunity) => {
    setDraggedOpportunity(opportunity);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedOpportunity && draggedOpportunity.pipelineStageId !== stageId) {
      await handleMoveOpportunity(draggedOpportunity.id, stageId);
    }
    setDraggedOpportunity(null);
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-background" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Opportunities</h1>
            <p className="text-muted-foreground">
              Manage your sales pipeline and deals
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowForm(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Opportunity
          </Button>
        </div>
      </div>

      {/* Pipeline Selector */}
      <Card className="border-border/50 shadow-sm">
        <div className="px-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Kanban className="w-5 h-5 text-muted-foreground" />
            <Select
              label=""
              value={selectedPipeline}
              onChange={(e) => setSelectedPipeline(e.target.value)}
              options={pipelines.map((p) => ({ value: p.id, label: p.name }))}
              className="min-w-[200px]"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-foreground" />
            <span className="text-sm text-muted-foreground">
              {opportunities.length} opportunities in this pipeline
            </span>
          </div>
        </div>
      </Card>

      {/* Pipeline Board */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-80 flex-shrink-0">
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : !currentPipeline ? (
        <Card className="border-border/50 shadow-sm">
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Kanban className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No pipelines found</h3>
            <p className="text-muted-foreground">Create one in GoHighLevel first.</p>
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
                  className="w-80 bg-muted/50 dark:bg-muted/20 rounded-xl p-4 flex-shrink-0 border border-border/50"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        {stage.name}
                      </h3>
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full font-medium">
                        {stageOpportunities.length}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        ${stageValue.toLocaleString()}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-3 min-h-[200px]">
                    {stageOpportunities.map((opportunity) => (
                      <div
                        key={opportunity.id}
                        draggable
                        onDragStart={() => handleDragStart(opportunity)}
                        className={cn(
                          "cursor-move transition-opacity",
                          draggedOpportunity?.id === opportunity.id && "opacity-50"
                        )}
                      >
                        <OpportunityCard
                          opportunity={opportunity}
                          pipeline={currentPipeline}
                          onEdit={handleEditOpportunity}
                          onDelete={handleDeleteOpportunity}
                          onMove={handleMoveOpportunity}
                        />
                      </div>
                    ))}

                    {stageOpportunities.length === 0 && (
                      <div className={cn(
                        "text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg",
                        draggedOpportunity && "border-purple-500 bg-purple-50 dark:bg-purple-900/10"
                      )}>
                        {draggedOpportunity ? 'Drop here' : 'No opportunities'}
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
