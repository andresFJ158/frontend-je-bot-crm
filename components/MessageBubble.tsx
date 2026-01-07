'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: {
    id: string;
    sender: 'user' | 'bot' | 'agent';
    content: string;
    createdAt: string;
    agentId?: string;
    agent?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAgent = message.sender === 'agent';
  const isBot = message.sender === 'bot';
  const isUser = message.sender === 'user';

  return (
    <div
      className={cn(
        'flex w-full',
        isAgent ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          isAgent && 'bg-primary text-white',
          isBot && 'bg-panel border border-border text-text-primary',
          isUser && 'bg-background border border-border text-text-primary'
        )}
      >
        <div className="text-xs mb-1 opacity-80">
          {isAgent && (
            <span className="font-medium">
              {message.agent?.name || 'Agente'}
            </span>
          )}
          {isBot && <span className="font-medium text-primary">Bot</span>}
          {isUser && <span className="font-medium">Usuario</span>}
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className="text-xs opacity-70 mt-1">
          {format(new Date(message.createdAt), 'HH:mm')}
        </p>
      </div>
    </div>
  );
}

