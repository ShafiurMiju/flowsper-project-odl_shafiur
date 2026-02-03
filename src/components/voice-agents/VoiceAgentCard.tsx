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
  // Determine active status based on inbound numbers
  const hasInboundNumbers = (agent.inboundNumbers && agent.inboundNumbers.length > 0) || agent.inboundNumber;
  const status = hasInboundNumbers ? 'active' : 'inactive';
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-foreground text-background';
      case 'inactive': return 'bg-muted text-muted-foreground';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
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
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Phone className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{agent.agentName}</h3>
              {agent.voiceId && (
                <p className="text-xs text-muted-foreground">Voice ID: {agent.voiceId}</p>
              )}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
            {status}
          </span>
        </div>

        {agent.welcomeMessage && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{agent.welcomeMessage}</p>
        )}

        {agent.agentPrompt && (
          <div className="mb-3 p-2 bg-muted/50 rounded">
            <p className="text-xs text-muted-foreground mb-1">Prompt:</p>
            <p className="text-sm text-foreground line-clamp-2">{agent.agentPrompt}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            {agent.language && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {agent.language}
              </span>
            )}
            {agent.patienceLevel && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                ⏱️ {agent.patienceLevel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCall(agent)}
              className="p-2 text-foreground hover:bg-muted rounded"
              title="Make test call"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(agent)}
              className="p-2 text-foreground hover:bg-muted rounded"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(agent.id)}
              className="p-2 text-foreground hover:bg-muted rounded"
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
