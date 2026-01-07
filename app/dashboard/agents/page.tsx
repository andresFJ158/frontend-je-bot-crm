'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '@/lib/store';
import api from '@/lib/api';

export default function AgentsPage() {
  const { agents, setAgents } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agent',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/agents', formData);
      await loadAgents();
      setShowCreate(false);
      setFormData({ name: '', email: '', password: '', role: 'agent' });
    } catch (error: any) {
      console.error('Error creating agent:', error);
      const errorMessage = error.response?.data?.message ||
        (Array.isArray(error.response?.data?.message)
          ? error.response.data.message.join(', ')
          : 'Error al crear el agente');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agentes</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Nuevo Agente</span>
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 p-4 bg-panel border border-border rounded-md">
          <h2 className="text-lg font-semibold mb-4">Crear Agente</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contraseña</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rol</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
              >
                <option value="agent">Agente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-background border border-border rounded-md"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent: any) => (
          <div
            key={agent.id}
            className="p-4 bg-panel border border-border rounded-md"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{agent.name}</h3>
              {agent.online && (
                <span className="text-xs text-success">● En línea</span>
              )}
            </div>
            <p className="text-sm text-text-secondary">{agent.email}</p>
            <p className="text-xs text-text-secondary mt-1">
              Rol: {agent.role === 'admin' ? 'Administrador' : 'Agente'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

