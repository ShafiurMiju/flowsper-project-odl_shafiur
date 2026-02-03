'use client';

import { GHLOpportunity, GHLPipeline } from '@/types';
import { DollarSign, User, Trash2, Edit2, ArrowRight, Target } from 'lucide-react';
import { Button } from '@/components/ui';

interface OpportunityCardProps {
  opportunity: GHLOpportunity;
  pipeline?: GHLPipeline;
  onEdit: (opportunity: GHLOpportunity) => void;
  onDelete: (opportunityId: string) => void;
  onMove: (opportunityId: string, newStageId: string) => void;
}

export function OpportunityCard({
  opportunity,
  pipeline,
  onEdit,
  onDelete,
  onMove,
}: OpportunityCardProps) {
  const currentStage = pipeline?.stages.find(
    (s) => s.id === opportunity.pipelineStageId
  );
  const currentStageIndex = pipeline?.stages.findIndex(
    (s) => s.id === opportunity.pipelineStageId
  );
  const nextStage =
    currentStageIndex !== undefined && currentStageIndex >= 0
      ? pipeline?.stages[currentStageIndex + 1]
      : undefined;

  const statusColors = {
    open: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    won: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    lost: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    abandoned: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground truncate">
              {opportunity.name}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                statusColors[opportunity.status]
              }`}
            >
              {opportunity.status}
            </span>
          </div>

          <div className="mt-3 space-y-1.5">
            {opportunity.monetaryValue && (
              <div className="flex items-center text-sm">
                <div className="w-6 h-6 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-2">
                  <DollarSign className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-semibold text-foreground">
                  ${opportunity.monetaryValue.toLocaleString()}
                </span>
              </div>
            )}
            {opportunity.contact && (
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="w-4 h-4 mr-2 text-muted-foreground/70 flex-shrink-0" />
                <span className="truncate">
                  {opportunity.contact.firstName} {opportunity.contact.lastName}
                </span>
              </div>
            )}
            {currentStage && (
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                <span>{currentStage.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 ml-2">
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(opportunity)}
              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(opportunity.id)}
              className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {nextStage && opportunity.status === 'open' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(opportunity.id, nextStage.id)}
              className="text-xs text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 gap-1 px-2"
            >
              <span className="truncate max-w-[80px]">{nextStage.name}</span>
              <ArrowRight className="w-3 h-3 flex-shrink-0" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
