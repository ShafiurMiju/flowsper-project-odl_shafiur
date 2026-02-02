import { GHLMessage } from '@/types';
import { format } from 'date-fns';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: GHLMessage;
  isOwn: boolean;
}

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  scheduled: Clock,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: AlertCircle,
  undelivered: AlertCircle,
};

const statusColors: Record<string, string> = {
  pending: 'text-gray-500',
  scheduled: 'text-yellow-500',
  sent: 'text-gray-400',
  delivered: 'text-blue-400',
  read: 'text-blue-500',
  failed: 'text-red-500',
  undelivered: 'text-red-500',
};

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const StatusIcon = statusIcons[message.status] || Check;
  
  // Safely format the date with fallback
  const formatMessageDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Message Bubble */}
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-700 text-gray-200 rounded-bl-none'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline block"
                >
                  Attachment {index + 1}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
          isOwn ? 'flex-row-reverse' : 'flex-row'
        }`}>
          <span>{formatMessageDate(message.dateAdded)}</span>
          {isOwn && (
            <StatusIcon className={`w-3 h-3 ${statusColors[message.status]}`} />
          )}
          <span className="capitalize">{message.type}</span>
        </div>
      </div>
    </div>
  );
}
