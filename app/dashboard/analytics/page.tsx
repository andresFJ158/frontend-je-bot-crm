'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Users, Bot, TrendingUp } from 'lucide-react';
import { useStore } from '@/lib/store';
import api from '@/lib/api';

export default function AnalyticsPage() {
  const { conversations } = useStore();
  const [stats, setStats] = useState({
    totalConversations: 0,
    botMode: 0,
    humanMode: 0,
    totalAgents: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [conversationsRes, agentsRes] = await Promise.all([
        api.get('/conversations'),
        api.get('/agents'),
      ]);

      const convs = conversationsRes.data;
      const agents = agentsRes.data;

      setStats({
        totalConversations: convs.length,
        botMode: convs.filter((c: any) => c.mode === 'BOT').length,
        humanMode: convs.filter((c: any) => c.mode === 'HUMAN').length,
        totalAgents: agents.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Conversaciones',
      value: stats.totalConversations,
      icon: MessageSquare,
      color: 'primary',
    },
    {
      title: 'Modo Bot',
      value: stats.botMode,
      icon: Bot,
      color: 'primary',
    },
    {
      title: 'Modo Humano',
      value: stats.humanMode,
      icon: Users,
      color: 'success',
    },
    {
      title: 'Agentes',
      value: stats.totalAgents,
      icon: TrendingUp,
      color: 'warning',
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analíticas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="p-6 bg-panel border border-border rounded-md"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon
                  size={24}
                  className={`text-${stat.color}`}
                />
              </div>
              <h3 className="text-sm text-text-secondary mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

