'use client';

import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { useStore } from '@/lib/store';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface AgentSelectorProps {
  conversation: {
    id: string;
    assignedAgentId?: string;
    assignedAgent?: {
      id: string;
      name: string;
    };
  };
}

export function AgentSelector({ conversation }: AgentSelectorProps) {
  const { agents, setAgents, updateConversation } = useStore();
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await api.get('/agents');
      setAgents(response.data);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const handleAssign = async (agentId: string | null) => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await api.post(`/conversations/${conversation.id}/assign`, {
        agentId: agentId || null,
      });
      updateConversation(response.data);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error assigning agent:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="px-4 py-2 bg-background border border-border rounded-md hover:bg-background/80 flex items-center gap-2"
      >
        <UserPlus size={18} />
        <span>
          {conversation.assignedAgent?.name || 'Asignar agente'}
        </span>
      </button>
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 bg-panel border border-border rounded-md shadow-lg w-64 z-10">
          <div className="p-2">
            <button
              onClick={() => handleAssign(null)}
              className="w-full text-left px-3 py-2 hover:bg-background rounded-md"
            >
              Sin asignar
            </button>
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleAssign(agent.id)}
                className={cn(
                  'w-full text-left px-3 py-2 hover:bg-background rounded-md',
                  conversation.assignedAgentId === agent.id && 'bg-primary/20'
                )}
              >
                {agent.name}
                {agent.online && (
                  <span className="ml-2 text-xs text-success">●</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

