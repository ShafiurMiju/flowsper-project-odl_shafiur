import { GHLConversation } from '@/types';
import { MessageCircle, Mail, Facebook, Instagram, Phone, Star } from 'lucide-react';
import { format } from 'date-fns';

interface ConversationCardProps {
  conversation: GHLConversation;
  onClick: (conversation: GHLConversation) => void;
  isActive?: boolean;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  SMS: Phone,
  Email: Mail,
  FB: Facebook,
  IG: Instagram,
  WhatsApp: Phone,
  Live_Chat: MessageCircle,
  Custom: MessageCircle,
};

export function ConversationCard({ conversation, onClick, isActive = false }: ConversationCardProps) {
  const Icon = typeIcons[conversation.type] || MessageCircle;
  const hasUnread = conversation.unreadCount > 0;

  return (
    <div
      onClick={() => onClick(conversation)}
      className={`p-4 border-b border-gray-700 cursor-pointer transition-colors hover:bg-gray-750 ${
        isActive ? 'bg-gray-750' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar/Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
          hasUnread ? 'bg-blue-500' : 'bg-gray-700'
        }`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-semibold truncate ${
              hasUnread ? 'text-white' : 'text-gray-300'
            }`}>
              {conversation.contactName || conversation.fullName || conversation.phone || 'Unknown'}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {conversation.starred && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
              {conversation.lastMessageDate && (
                <span className="text-xs text-gray-500">
                  {format(new Date(conversation.lastMessageDate), 'MMM d')}
                </span>
              )}
            </div>
          </div>

          {/* Last Message */}
          {conversation.lastMessageBody && (
            <p className={`text-sm truncate ${
              hasUnread ? 'text-gray-300 font-medium' : 'text-gray-500'
            }`}>
              {conversation.lastMessageBody}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-600">{conversation.type}</span>
            {hasUnread && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
