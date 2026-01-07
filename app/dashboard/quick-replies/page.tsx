'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, MessageSquare, Search } from 'lucide-react';
import api from '@/lib/api';

interface QuickReply {
  id: string;
  title: string;
  message: string;
  category?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function QuickRepliesPage() {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuickReply, setEditingQuickReply] = useState<QuickReply | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: '',
    order: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    loadQuickReplies();
    loadCategories();
  }, [filterCategory]);

  const loadQuickReplies = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);

      const response = await api.get(`/quick-replies?${params.toString()}`);
      let replies = response.data;

      // Filtrar por búsqueda si hay término
      if (searchTerm) {
        replies = replies.filter(
          (reply: QuickReply) =>
            reply.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reply.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (reply.category && reply.category.toLowerCase().includes(searchTerm.toLowerCase())),
        );
      }

      setQuickReplies(replies);
    } catch (error) {
      console.error('Error loading quick replies:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/quick-replies/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    loadQuickReplies();
  }, [searchTerm]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/quick-replies', {
        ...formData,
        category: formData.category || undefined,
        order: formData.order ? parseInt(formData.order) : 0,
      });
      await loadQuickReplies();
      await loadCategories();
      setShowForm(false);
      setFormData({ title: '', message: '', category: '', order: '' });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al crear la respuesta rápida');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuickReply) return;

    setLoading(true);
    setError('');

    try {
      await api.patch(`/quick-replies/${editingQuickReply.id}`, {
        ...formData,
        category: formData.category || undefined,
        order: formData.order ? parseInt(formData.order) : 0,
      });
      await loadQuickReplies();
      await loadCategories();
      setShowForm(false);
      setEditingQuickReply(null);
      setFormData({ title: '', message: '', category: '', order: '' });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al actualizar la respuesta rápida');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta respuesta rápida?')) {
      return;
    }

    try {
      await api.delete(`/quick-replies/${id}`);
      await loadQuickReplies();
      await loadCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar la respuesta rápida');
    }
  };

  const handleEdit = (quickReply: QuickReply) => {
    setEditingQuickReply(quickReply);
    setFormData({
      title: quickReply.title,
      message: quickReply.message,
      category: quickReply.category || '',
      order: quickReply.order.toString(),
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingQuickReply(null);
    setFormData({ title: '', message: '', category: '', order: '' });
    setError('');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Respuestas Rápidas</h1>
        <button
          onClick={() => {
            setEditingQuickReply(null);
            setFormData({ title: '', message: '', category: '', order: '' });
            setError('');
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Nueva Respuesta Rápida</span>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-panel border border-border rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Search size={16} />
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, mensaje o categoría..."
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Categoría</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Reply Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-panel border border-border rounded-md">
          <h2 className="text-lg font-semibold mb-4">
            {editingQuickReply ? 'Editar Respuesta Rápida' : 'Crear Respuesta Rápida'}
          </h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={editingQuickReply ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  required
                  placeholder="Ej: Saludo inicial"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Categoría (Opcional)</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  list="categories-list"
                  placeholder="Ej: saludos, despedidas, productos"
                />
                <datalist id="categories-list">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mensaje</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
                rows={4}
                required
                placeholder="Escribe el mensaje predeterminado..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Orden (Opcional)</label>
              <input
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
                placeholder="0"
              />
              <p className="text-xs text-text-secondary mt-1">
                Usa el orden para organizar las respuestas rápidas (menor número = aparece primero)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading
                  ? editingQuickReply
                    ? 'Actualizando...'
                    : 'Creando...'
                  : editingQuickReply
                    ? 'Actualizar'
                    : 'Crear'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-background border border-border rounded-md"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Replies List */}
      {quickReplies.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay respuestas rápidas. Crea tu primera respuesta rápida para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickReplies.map((quickReply) => (
            <div
              key={quickReply.id}
              className="p-4 bg-panel border border-border rounded-md hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{quickReply.title}</h3>
                  {quickReply.category && (
                    <span className="text-xs px-2 py-1 bg-background rounded-md text-text-secondary mb-2 inline-block">
                      {quickReply.category}
                    </span>
                  )}
                  <p className="text-sm text-text-secondary line-clamp-3 mt-2">
                    {quickReply.message}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(quickReply)}
                    className="p-2 text-text-secondary hover:text-primary hover:bg-background rounded-md transition-colors"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(quickReply.id)}
                    className="p-2 text-text-secondary hover:text-error hover:bg-background rounded-md transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

