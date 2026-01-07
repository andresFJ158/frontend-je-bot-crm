'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStore } from '@/lib/store';
import { TagBadge } from './TagBadge';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function ChatList() {
  const { conversations, selectedConversation, setSelectedConversation } = useStore();
  const [highlightedConversation, setHighlightedConversation] = useState<string | null>(null);

  // Sort conversations: unread first, then by updatedAt
  const sortedConversations = [...conversations].sort((a, b) => {
    const aUnread = a.unreadCount || 0;
    const bUnread = b.unreadCount || 0;

    // If both have unread or both don't, sort by updatedAt
    if ((aUnread > 0 && bUnread > 0) || (aUnread === 0 && bUnread === 0)) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    // Unread conversations first
    return bUnread - aUnread;
  });

  // Highlight conversation when it gets a new message
  useEffect(() => {
    const unreadConversations = conversations.filter(c => (c.unreadCount || 0) > 0);
    if (unreadConversations.length > 0) {
      const latestUnread = unreadConversations.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];

      if (latestUnread && latestUnread.id !== selectedConversation?.id) {
        setHighlightedConversation(latestUnread.id);
        setTimeout(() => setHighlightedConversation(null), 2000);
      }
    }
  }, [conversations, selectedConversation]);

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-text-secondary">
          <p className="mb-2">No hay conversaciones</p>
          <p className="text-xs">
            Las conversaciones aparecerán cuando:
          </p>
          <ul className="text-xs mt-2 text-left list-disc list-inside space-y-1">
            <li>WhatsApp esté conectado</li>
            <li>Lleguen mensajes nuevos</li>
            <li>Se sincronicen conversaciones existentes</li>
          </ul>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {sortedConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={cn(
                'w-full p-4 text-left hover:bg-background transition-all relative',
                selectedConversation?.id === conversation.id && 'bg-background',
                (conversation.unreadCount || 0) > 0 && selectedConversation?.id !== conversation.id && 'bg-primary/5 border-l-2 border-l-primary',
                highlightedConversation === conversation.id && 'animate-pulse bg-primary/10'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-text-primary truncate">
                      {conversation.user?.name || conversation.user?.phone || 'Usuario'}
                    </h3>
                    {(conversation.unreadCount || 0) > 0 && (
                      <span className="flex-shrink-0 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {conversation.unreadCount! > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "text-sm mt-1 line-clamp-2",
                    (conversation.unreadCount || 0) > 0
                      ? "text-text-primary font-medium"
                      : "text-text-secondary"
                  )}>
                    {conversation.lastMessage || 'Sin mensajes'}
                  </p>
                </div>
                <div className="ml-4 flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="text-xs text-text-secondary">
                    {format(new Date(conversation.updatedAt), 'HH:mm', { locale: es })}
                  </div>
                  {(conversation.unreadCount || 0) > 0 && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {conversation.tag && <TagBadge tag={conversation.tag} />}
                <span
                  className={cn(
                    'text-xs px-2 py-1 rounded',
                    conversation.mode === 'BOT'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-success/20 text-success'
                  )}
                >
                  {conversation.mode === 'BOT' ? 'Bot' : 'Humano'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

