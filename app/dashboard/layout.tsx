'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Sidebar } from '@/components/Sidebar';
import { ToastContainer } from '@/components/Toast';
import { MessageNotification } from '@/components/MessageNotification';
import { requestNotificationPermission, showBrowserNotification } from '@/lib/notifications';
import { playBeep } from '@/lib/sounds';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { agent, token, setAgent, setToken, initializeSocket } = useStore();
  const [notificationMessage, setNotificationMessage] = useState<{
    message: any;
    conversation: any;
  } | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const storedToken = localStorage.getItem('token');
    const storedAgent = localStorage.getItem('agent');

    if (!storedToken || !storedAgent) {
      // Clear any partial data
      localStorage.removeItem('token');
      localStorage.removeItem('agent');
      router.replace('/login');
      return;
    }

    // Initialize store from localStorage immediately
    if (storedToken && storedAgent) {
      // Always set token and agent to ensure they're in sync with localStorage
      setToken(storedToken);
      try {
        setAgent(JSON.parse(storedAgent));
      } catch (error) {
        console.error('Error parsing agent from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('agent');
        router.replace('/login');
        return;
      }
    }

    // Initialize socket after token is set
    const currentToken = useStore.getState().token || storedToken;
    if (currentToken && !useStore.getState().socket) {
      // Use setTimeout to ensure token is in store
      setTimeout(() => {
        initializeSocket();
      }, 0);
    }
  }, [router, setAgent, setToken, initializeSocket]);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Listen for new messages and show notifications
  useEffect(() => {
    const socket = useStore.getState().socket;
    if (!socket) {
      // Wait for socket to be initialized
      const checkSocket = setInterval(() => {
        const currentSocket = useStore.getState().socket;
        if (currentSocket) {
          clearInterval(checkSocket);
          setupSocketListeners(currentSocket);
        }
      }, 500);

      return () => clearInterval(checkSocket);
    }

    setupSocketListeners(socket);

    return () => {
      socket.off('new_message');
      socket.off('incoming_message');
      socket.off('new_order');
    };
  }, []);

  const setupSocketListeners = (socket: any) => {

    const handleNewMessage = (data: any) => {
      const message = data;
      const conversationData = data.conversation;
      const selectedConversation = useStore.getState().selectedConversation;

      // Only show notification if:
      // 1. The message is not from the current user (agent)
      // 2. The conversation is not currently selected
      // 3. The message is from a user (not bot)
      if (
        message.sender === 'user' &&
        selectedConversation?.id !== message.conversationId
      ) {
        // Try to get conversation from store first, then use data from message
        let conversation = useStore
          .getState()
          .conversations.find((c) => c.id === message.conversationId);

        // If conversation not in store but we have data from message, use it
        if (!conversation && conversationData) {
          conversation = conversationData;
        }

        if (conversation) {
          const userName = conversation?.user?.name || conversation?.user?.phone || 'Usuario';

          // Play notification sound
          playBeep();

          // Show browser notification
          showBrowserNotification('Nuevo mensaje', {
            body: `${userName}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
            tag: message.conversationId,
            requireInteraction: false,
          });

          // Show popup notification
          setNotificationMessage({
            message,
            conversation,
          });

          // Auto-close popup after 5 seconds
          setTimeout(() => {
            setNotificationMessage(null);
          }, 5000);
        }
      }
    };

    const handleNewConversation = (data: any) => {
      const conversation = data.conversation;
      const userName = conversation?.user?.name || conversation?.user?.phone || 'Usuario';

      // Play notification sound
      playBeep();

      showBrowserNotification('Nueva conversación', {
        body: `Nueva conversación con ${userName}`,
        tag: conversation.id,
        requireInteraction: false,
      });
    };

    const handleNewOrder = (order: any) => {
      // Play notification sound
      playBeep();

      const branchName = order.branch?.name || 'Sucursal desconocida';
      const customerName = order.user 
        ? `${order.user.name} ${order.user.lastName || ''}`.trim()
        : 'Cliente sin registrar';
      const itemsCount = order.items?.length || 0;
      const total = order.total || 0;

      // Show browser notification
      showBrowserNotification('Nuevo Pedido', {
        body: `Pedido #${order.id.substring(0, 8)} - ${branchName}\n${customerName} - ${itemsCount} items - Bs.${total.toFixed(2)}`,
        tag: `order-${order.id}`,
        requireInteraction: false,
        icon: '/favicon.ico',
      });

      // Show toast notification
      useStore.getState().addToast(
        `Nuevo pedido #${order.id.substring(0, 8)} - ${branchName} - Bs.${total.toFixed(2)}`,
        'success',
        5000
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('incoming_message', handleNewConversation);
    socket.on('new_order', handleNewOrder);
  };

  if (!agent || !token) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </div>
      <ToastContainer />
      {notificationMessage && (
        <MessageNotification
          message={notificationMessage.message}
          conversation={notificationMessage.conversation}
          onClose={() => setNotificationMessage(null)}
        />
      )}
    </div>
  );
}

