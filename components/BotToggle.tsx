'use client';

import { useState } from 'react';
import { Bot, User } from 'lucide-react';
import { useStore } from '@/lib/store';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface BotToggleProps {
  conversation: {
    id: string;
    mode: 'BOT' | 'HUMAN';
  };
}

export function BotToggle({ conversation }: BotToggleProps) {
  const { updateConversation } = useStore();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const newMode = conversation.mode === 'BOT' ? 'HUMAN' : 'BOT';
      const response = await api.post(`/conversations/${conversation.id}/mode`, {
        mode: newMode,
      });
      updateConversation(response.data);
    } catch (error) {
      console.error('Error updating mode:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'px-4 py-2 rounded-md flex items-center gap-2 transition-colors',
        conversation.mode === 'BOT'
          ? 'bg-primary text-white hover:bg-primary/90'
          : 'bg-background border border-border text-text-primary hover:bg-background/80',
        loading && 'opacity-50 cursor-not-allowed'
      )}
    >
      {conversation.mode === 'BOT' ? (
        <>
          <Bot size={18} />
          <span>Bot Activo</span>
        </>
      ) : (
        <>
          <User size={18} />
          <span>Modo Humano</span>
        </>
      )}
    </button>
  );
}

