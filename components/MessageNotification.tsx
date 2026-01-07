'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface MessageNotificationProps {
    message: {
        id: string;
        conversationId: string;
        sender: 'user' | 'bot' | 'agent';
        content: string;
        createdAt: string;
    };
    conversation: {
        id: string;
        user?: {
            name?: string;
            phone?: string;
        };
    };
    onClose: () => void;
}

export function MessageNotification({ message, conversation, onClose }: MessageNotificationProps) {
    const router = useRouter();
    const { setSelectedConversation } = useStore();

    const handleClick = () => {
        setSelectedConversation(conversation as any);
        router.push('/dashboard');
        onClose();
    };

    const userName = conversation.user?.name || conversation.user?.phone || 'Usuario';

    return (
        <div className="fixed bottom-4 right-4 bg-panel border border-border rounded-lg shadow-2xl p-4 max-w-sm z-50 animate-slide-up transform transition-all">
            <div className="flex items-start gap-3">
                <div className="bg-primary/20 p-2 rounded-full">
                    <MessageSquare className="text-primary" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-text-primary">Nuevo mensaje</h4>
                        <button
                            onClick={onClose}
                            className="text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <p className="text-sm font-medium text-primary mb-1">{userName}</p>
                    <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                        {message.content}
                    </p>
                    <button
                        onClick={handleClick}
                        className="w-full px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                        Ver conversación
                    </button>
                </div>
            </div>
        </div>
    );
}

