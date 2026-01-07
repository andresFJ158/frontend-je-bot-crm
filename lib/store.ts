import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Toast, ToastType } from '@/components/Toast';

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  online?: boolean;
}

interface Conversation {
  id: string;
  userId: string;
  assignedAgentId?: string;
  tag?: string;
  mode: 'BOT' | 'HUMAN';
  lastMessage?: string;
  updatedAt: string;
  unreadCount?: number; // Number of unread messages
  user?: {
    id: string;
    name: string;
    phone: string;
  };
  assignedAgent?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'bot' | 'agent';
  content: string;
  createdAt: string;
  agentId?: string;
  agent?: {
    id: string;
    name: string;
    email: string;
  };
}

interface AppState {
  agent: Agent | null;
  token: string | null;
  socket: Socket | null;
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  agents: Agent[];
  toasts: Toast[];
  setAgent: (agent: Agent | null) => void;
  setToken: (token: string | null) => void;
  setSocket: (socket: Socket | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Conversation) => void;
  setSelectedConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  incrementUnreadCount: (conversationId: string) => void;
  resetUnreadCount: (conversationId: string) => void;
  setAgents: (agents: Agent[]) => void;
  initializeSocket: () => void;
  disconnectSocket: () => void;
  addToast: (message: string, type?: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  agent: null,
  token: null,
  socket: null,
  conversations: [],
  selectedConversation: null,
  messages: [],
  agents: [],
  toasts: [],

  setAgent: (agent) => {
    set({ agent });
    if (agent) {
      localStorage.setItem('agent', JSON.stringify(agent));
    } else {
      localStorage.removeItem('agent');
    }
  },

  setToken: (token) => {
    set({ token });
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  setSocket: (socket) => set({ socket }),

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) => {
    const conversations = get().conversations;
    const existing = conversations.find((c) => c.id === conversation.id);
    if (existing) {
      // Preserve unreadCount when updating existing conversation
      const updatedConversation = {
        ...conversation,
        unreadCount: conversation.unreadCount !== undefined
          ? conversation.unreadCount
          : existing.unreadCount || 0,
      };
      set({
        conversations: conversations.map((c) =>
          c.id === conversation.id ? updatedConversation : c
        ),
      });
    } else {
      // New conversation - initialize with unreadCount if not provided
      const newConversation = {
        ...conversation,
        unreadCount: conversation.unreadCount || 0,
      };
      set({ conversations: [newConversation, ...conversations] });
    }
  },

  updateConversation: (conversation) => {
    const conversations = get().conversations;
    const existing = conversations.find((c) => c.id === conversation.id);
    // Preserve unreadCount when updating conversation
    const updatedConversation = {
      ...conversation,
      unreadCount: conversation.unreadCount !== undefined
        ? conversation.unreadCount
        : existing?.unreadCount || 0,
    };
    set({
      conversations: conversations.map((c) =>
        c.id === conversation.id ? updatedConversation : c
      ),
    });
    if (get().selectedConversation?.id === conversation.id) {
      set({ selectedConversation: updatedConversation });
    }
  },

  setSelectedConversation: (conversation) => {
    set({ selectedConversation: conversation });
    // Reset unread count when conversation is selected
    if (conversation) {
      get().resetUnreadCount(conversation.id);
    }
  },

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => {
    const messages = get().messages;
    if (!messages.find((m) => m.id === message.id)) {
      set({ messages: [...messages, message] });
    }

    // Increment unread count if message is from user and conversation is not selected
    const selectedConversation = get().selectedConversation;
    if (
      message.sender === 'user' &&
      message.conversationId !== selectedConversation?.id
    ) {
      get().incrementUnreadCount(message.conversationId);
    }
  },

  incrementUnreadCount: (conversationId: string) => {
    const conversations = get().conversations;
    set({
      conversations: conversations.map((c) =>
        c.id === conversationId
          ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
          : c
      ),
    });
  },

  resetUnreadCount: (conversationId: string) => {
    const conversations = get().conversations;
    set({
      conversations: conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    });
  },

  setAgents: (agents) => set({ agents }),

  initializeSocket: () => {
    // Try to get token from store first, then from localStorage
    let token = get().token;
    if (!token) {
      token = localStorage.getItem('token');
      if (token) {
        set({ token });
      }
    }

    if (!token) {
      console.warn('No token available for socket connection');
      return;
    }

    // Disconnect existing socket if any
    const existingSocket = get().socket;
    if (existingSocket) {
      existingSocket.disconnect();
    }

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9090', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected the socket, reconnect manually
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('connected', (data: any) => {
      console.log('Socket authenticated:', data);
    });

    socket.on('new_message', (data: any) => {
      const message = data;
      const conversationData = data.conversation;
      
      console.log('Received new_message:', message.id);
      
      // Prevent duplicate messages
      const existingMessages = get().messages;
      if (existingMessages.find((m) => m.id === message.id)) {
        console.log('Message already exists, skipping:', message.id);
        return;
      }

      get().addMessage(message);

      // Update or add conversation
      const conversations = get().conversations;
      const existingConversation = conversations.find(c => c.id === message.conversationId);
      
      if (conversationData) {
        // Use conversation data from the message
        if (existingConversation) {
          get().updateConversation({
            ...conversationData,
            lastMessage: message.content,
            updatedAt: message.createdAt,
            unreadCount: existingConversation.unreadCount || 0,
          });
        } else {
          // Add new conversation if it doesn't exist
          get().addConversation({
            ...conversationData,
            lastMessage: message.content,
            updatedAt: message.createdAt,
            unreadCount: message.sender === 'user' ? 1 : 0,
          });
        }
      } else if (existingConversation) {
        // Update existing conversation with new message info
        get().updateConversation({
          ...existingConversation,
          lastMessage: message.content,
          updatedAt: message.createdAt,
        });
      } else {
        // If conversation doesn't exist and we don't have data, try to load it
        console.warn('Conversation not found for message:', message.conversationId);
        // Try to reload conversations from the page component
        // This will be handled by the dashboard page
      }
    });

    socket.on('conversation_update', (conversation: Conversation) => {
      console.log('Received conversation_update:', conversation.id);
      
      // Prevent duplicate updates by checking if conversation exists
      const existingConversations = get().conversations;
      const existing = existingConversations.find((c) => c.id === conversation.id);
      
      // Only update if conversation exists or if it's a new one
      if (existing || !existing) {
        get().updateConversation(conversation);
      }
    });

    socket.on('incoming_message', (data: any) => {
      console.log('Received incoming_message');
      
      // Check if conversation already exists
      const existingConversations = get().conversations;
      const existing = existingConversations.find((c) => c.id === data.conversation?.id);
      
      if (existing) {
        // Conversation exists, just update it and increment unread
        get().incrementUnreadCount(data.conversation.id);
        get().updateConversation({
          ...data.conversation,
          unreadCount: (existing.unreadCount || 0) + 1,
        });
      } else {
        // New conversation
        const conversation = {
          ...data.conversation,
          unreadCount: 1, // New conversation starts with 1 unread
        };
        get().addConversation(conversation);
      }
    });

    socket.on('new_order', (order: any) => {
      console.log('Received new_order:', order.id);
      // Order notifications are handled in layout.tsx
      // This listener is here for potential future use (e.g., updating order list in real-time)
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  // Toast notifications
  addToast: (message: string, type: ToastType = 'info', duration?: number) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, type, duration };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    return id;
  },

  removeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

