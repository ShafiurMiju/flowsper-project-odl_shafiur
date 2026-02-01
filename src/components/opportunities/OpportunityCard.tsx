'use client';

import { GHLOpportunity, GHLPipeline } from '@/types';
import { DollarSign, User, Trash2, Edit2, ArrowRight } from 'lucide-react';
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
    open: 'bg-blue-100 text-blue-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
    abandoned: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {opportunity.name}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                statusColors[opportunity.status]
              }`}
            >
              {opportunity.status}
            </span>
          </div>

          <div className="mt-2 space-y-1">
            {opportunity.monetaryValue && (
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                <span className="font-medium">
                  ${opportunity.monetaryValue.toLocaleString()}
                </span>
              </div>
            )}
            {opportunity.contact && (
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {opportunity.contact.firstName} {opportunity.contact.lastName}
                </span>
              </div>
            )}
            {currentStage && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                <span>{currentStage.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 ml-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(opportunity)}
              className="p-2"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(opportunity.id)}
              className="p-2 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {nextStage && opportunity.status === 'open' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(opportunity.id, nextStage.id)}
              className="text-xs"
            >
              Move to {nextStage.name}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
