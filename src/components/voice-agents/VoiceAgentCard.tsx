'use client';

import { GHLVoiceAgent } from '@/types';
import { Card } from '@/components/ui';
import { Phone, Edit2, Trash2, Play, Pause } from 'lucide-react';

interface VoiceAgentCardProps {
  agent: GHLVoiceAgent;
  onEdit: (agent: GHLVoiceAgent) => void;
  onDelete: (agentId: string) => void;
  onCall: (agent: GHLVoiceAgent) => void;
}

export function VoiceAgentCard({ agent, onEdit, onDelete, onCall }: VoiceAgentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{agent.name}</h3>
              {agent.voiceName && (
                <p className="text-xs text-gray-500">Voice: {agent.voiceName}</p>
              )}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
            {getStatusIcon(agent.status)}
            {agent.status}
          </span>
        </div>

        {agent.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{agent.description}</p>
        )}

        {agent.objective && (
          <div className="mb-3 p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-500 mb-1">Objective:</p>
            <p className="text-sm text-gray-700 line-clamp-2">{agent.objective}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {agent.language && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {agent.language}
              </span>
            )}
            {agent.recordCalls && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                📹 Recording
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCall(agent)}
              className="p-2 text-green-600 hover:bg-green-50 rounded"
              title="Make test call"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(agent)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(agent.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
