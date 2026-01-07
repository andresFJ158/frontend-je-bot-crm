'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, Zap } from 'lucide-react';
import { useStore } from '@/lib/store';
import { MessageBubble } from './MessageBubble';
import { BotToggle } from './BotToggle';
import { AgentSelector } from './AgentSelector';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useNotifications } from '@/lib/notifications';

interface QuickReply {
  id: string;
  title: string;
  message: string;
  category?: string;
}

export function ChatWindow() {
  const { selectedConversation, messages, addMessage, updateConversation, setMessages } = useStore();
  const { showSuccess, showError } = useNotifications();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadQuickReplies();
  }, []);

  const loadQuickReplies = async () => {
    try {
      const response = await api.get('/quick-replies');
      setQuickReplies(response.data);
    } catch (error) {
      console.error('Error loading quick replies:', error);
    }
  };

  const handleQuickReplyClick = (quickReply: QuickReply) => {
    setInput(quickReply.message);
    setShowQuickReplies(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      await api.post('/messages', {
        conversationId: selectedConversation.id,
        sender: 'agent',
        content: input.trim(),
      });

      // Message will be added via socket
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSyncMessages = async () => {
    if (!selectedConversation || syncing) return;

    if (!confirm('¿Estás seguro? Esto borrará todos los mensajes actuales y los reemplazará con los mensajes desde WhatsApp.')) {
      return;
    }

    setSyncing(true);
    try {
      // Clear current messages first
      setMessages([]);

      const response = await api.post(`/whatsapp/sync-messages/${selectedConversation.id}`);

      if (response.data.success) {
        // Reload all messages from database (now synced from WhatsApp)
        const messagesResponse = await api.get(`/messages/conversation/${selectedConversation.id}`);
        setMessages(messagesResponse.data);

        // Scroll to bottom after loading
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        showSuccess(response.data.message || `Chat sincronizado: ${response.data.syncedCount} mensajes cargados`);
      } else {
        showError(response.data.message || 'Error al sincronizar mensajes');
        // Reload messages even on error to restore previous state
        const messagesResponse = await api.get(`/messages/conversation/${selectedConversation.id}`);
        setMessages(messagesResponse.data);
      }
    } catch (error: any) {
      console.error('Error syncing messages:', error);
      showError(error.response?.data?.message || 'Error al sincronizar mensajes');
      // Reload messages on error to restore previous state
      try {
        const messagesResponse = await api.get(`/messages/conversation/${selectedConversation.id}`);
        setMessages(messagesResponse.data);
      } catch (reloadError) {
        console.error('Error reloading messages:', reloadError);
      }
    } finally {
      setSyncing(false);
    }
  };

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary">
        Selecciona una conversación para comenzar
      </div>
    );
  }

  // Filter and sort messages by creation date
  const conversationMessages = messages
    .filter((m) => m.conversationId === selectedConversation.id)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-text-primary">
            {selectedConversation.user?.name || selectedConversation.user?.phone}
          </h2>
          <p className="text-sm text-text-secondary">
            {selectedConversation.user?.phone}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSyncMessages}
            disabled={syncing}
            className="px-3 py-2 bg-background border border-border rounded-md hover:bg-panel disabled:opacity-50 flex items-center gap-2 text-sm"
            title="Sincronizar mensajes desde WhatsApp"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
          <AgentSelector conversation={selectedConversation} />
          <BotToggle conversation={selectedConversation} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationMessages.length === 0 ? (
          <div className="text-center text-text-secondary py-8">
            No hay mensajes aún
          </div>
        ) : (
          conversationMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border">
        {/* Quick Replies Panel */}
        {showQuickReplies && quickReplies.length > 0 && (
          <div className="mb-4 p-3 bg-panel border border-border rounded-md max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Respuestas Rápidas</h3>
              <button
                onClick={() => setShowQuickReplies(false)}
                className="text-xs text-text-secondary hover:text-text-primary"
              >
                Cerrar
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {quickReplies.map((quickReply) => (
                <button
                  key={quickReply.id}
                  onClick={() => handleQuickReplyClick(quickReply)}
                  className="text-left p-2 bg-background hover:bg-panel rounded-md text-sm transition-colors"
                  title={quickReply.message}
                >
                  <div className="font-medium">{quickReply.title}</div>
                  {quickReply.category && (
                    <div className="text-xs text-text-secondary">{quickReply.category}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowQuickReplies(!showQuickReplies)}
            className="px-3 py-2 bg-background border border-border rounded-md hover:bg-panel flex items-center gap-2"
            title="Respuestas rápidas"
          >
            <Zap size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={20} />
            <span>Enviar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

