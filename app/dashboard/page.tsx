'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Topbar } from '@/components/Topbar';
import { ChatList } from '@/components/ChatList';
import { ChatWindow } from '@/components/ChatWindow';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export default function DashboardPage() {
  const {
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    setMessages,
    token,
  } = useStore();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ tag?: string; mode?: string }>({});

  useEffect(() => {
    // Wait for token to be available before making requests
    const storedToken = localStorage.getItem('token');
    const currentToken = token || storedToken;

    if (currentToken) {
      // Ensure token is in store if it's only in localStorage
      if (!token && storedToken) {
        useStore.getState().setToken(storedToken);
      }
      loadConversations();
    } else {
      // No token available, set loading to false
      console.warn('No token available for loading conversations');
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      // Reset unread count when conversation is selected
      useStore.getState().resetUnreadCount(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      // Verify token exists before making request
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available for request');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.mode) params.append('mode', filters.mode);

      console.log('Loading conversations...');
      const response = await api.get(`/conversations?${params.toString()}`);
      console.log('Conversations loaded:', response.data?.length || 0, 'conversations');
      // Initialize conversations with unreadCount: 0 if not present
      const conversationsWithUnread = (response.data || []).map((conv: any) => ({
        ...conv,
        unreadCount: conv.unreadCount || 0,
      }));
      setConversations(conversationsWithUnread);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
      });
      if (error.response?.status === 401) {
        // Token is invalid, will be handled by interceptor
        console.error('Unauthorized - token may be invalid or expired');
      } else if (error.response?.status === 500) {
        console.error('Server error - check backend logs');
      }
      // Set empty array on error to show "No hay conversaciones"
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/messages/conversation/${conversationId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSearch = (query: string) => {
    // Implement search logic if needed
    console.log('Search:', query);
  };

  const handleFilter = (newFilters: { tag?: string; mode?: string }) => {
    setFilters(newFilters);
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar onSearch={handleSearch} onFilter={handleFilter} />
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List - Hidden on mobile when conversation is selected */}
        <div className={cn(
          "w-full md:w-80 border-r border-border flex flex-col",
          selectedConversation ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm sm:text-base">Conversaciones</h2>
            {conversations.some(c => (c.unreadCount || 0) > 0) && (
              <span className="bg-primary text-white text-xs font-bold rounded-full px-2 py-1">
                {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
              </span>
            )}
          </div>
          {loading ? (
            <div className="p-4 text-center text-text-secondary">Cargando...</div>
          ) : (
            <ChatList />
          )}
        </div>
        
        {/* Chat Window - Full width on mobile when conversation is selected */}
        <div className={cn(
          "flex-1 flex flex-col",
          selectedConversation ? "flex" : "hidden md:flex"
        )}>
          {selectedConversation && (
            <div className="md:hidden p-3 border-b border-border flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-2 hover:bg-background rounded-md transition-colors"
                aria-label="Volver a conversaciones"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {selectedConversation.user?.name || selectedConversation.user?.phone || 'Usuario'}
                </h3>
              </div>
            </div>
          )}
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}

