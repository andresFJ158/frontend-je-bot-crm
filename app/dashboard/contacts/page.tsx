'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, User, Search, MapPin, Mail, Phone } from 'lucide-react';
import api from '@/lib/api';

interface Contact {
  id: string;
  phone: string;
  name: string;
  lastName?: string;
  email?: string;
  city?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  _count: {
    conversations: number;
  };
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    lastName: '',
    email: '',
    city: '',
    initialMessage: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadContacts();
    loadCities();
    loadStats();
  }, [filterCity, searchTerm]);

  const loadContacts = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCity) params.append('city', filterCity);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/contacts?${params.toString()}`);
      setContacts(response.data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadCities = async () => {
    try {
      const response = await api.get('/contacts/cities');
      setCities(response.data);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/contacts/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/contacts', {
        ...formData,
        lastName: formData.lastName || undefined,
        email: formData.email || undefined,
        city: formData.city || undefined,
        initialMessage: formData.initialMessage || undefined,
      });
      await loadContacts();
      await loadStats();
      setShowForm(false);
      setFormData({ phone: '', name: '', lastName: '', email: '', city: '', initialMessage: '' });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al crear el contacto');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    setLoading(true);
    setError('');

    try {
      await api.patch(`/contacts/${editingContact.id}`, {
        ...formData,
        phone: formData.phone || undefined,
        lastName: formData.lastName || undefined,
        email: formData.email || undefined,
        city: formData.city || undefined,
      });
      await loadContacts();
      await loadStats();
      setShowForm(false);
      setEditingContact(null);
      setFormData({ phone: '', name: '', lastName: '', email: '', city: '', initialMessage: '' });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al actualizar el contacto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este contacto?')) {
      return;
    }

    try {
      await api.delete(`/contacts/${id}`);
      await loadContacts();
      await loadStats();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar el contacto');
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      phone: contact.phone,
      name: contact.name,
      lastName: contact.lastName || '',
      email: contact.email || '',
      city: contact.city || '',
      initialMessage: '',
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingContact(null);
    setFormData({ phone: '', name: '', lastName: '', email: '', city: '', initialMessage: '' });
    setError('');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Contactos</h1>
        <button
          onClick={() => {
            setEditingContact(null);
            setFormData({ phone: '', name: '', lastName: '', email: '', city: '', initialMessage: '' });
            setError('');
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Nuevo Contacto</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-panel border border-border rounded-md">
            <div className="text-sm text-text-secondary mb-1">Total Contactos</div>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
          </div>
          <div className="p-4 bg-panel border border-border rounded-md">
            <div className="text-sm text-text-secondary mb-1">Con Ciudad</div>
            <div className="text-2xl font-bold">{stats.contactsWithCity}</div>
          </div>
          <div className="p-4 bg-panel border border-border rounded-md">
            <div className="text-sm text-text-secondary mb-1">Con Email</div>
            <div className="text-2xl font-bold">{stats.contactsWithEmail}</div>
          </div>
          <div className="p-4 bg-panel border border-border rounded-md">
            <div className="text-sm text-text-secondary mb-1">Con Conversaciones</div>
            <div className="text-2xl font-bold">{stats.contactsWithConversations}</div>
          </div>
        </div>
      )}

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
              placeholder="Buscar por nombre, apellido, teléfono o email..."
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <MapPin size={16} />
              Ciudad
            </label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            >
              <option value="">Todas las ciudades</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-panel border border-border rounded-md">
          <h2 className="text-lg font-semibold mb-4">
            {editingContact ? 'Editar Contacto' : 'Crear Contacto'}
          </h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={editingContact ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-2">Apellido</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Número de Celular</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  required
                />
                {editingContact && (
                  <p className="text-xs text-text-secondary mt-1">Puedes corregir el número si Baileys lo guardó incorrectamente</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ciudad</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  list="cities-list"
                />
                <datalist id="cities-list">
                  {cities.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
              </div>
            </div>
            {!editingContact && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mensaje Inicial (Opcional)
                </label>
                <textarea
                  value={formData.initialMessage}
                  onChange={(e) => setFormData({ ...formData, initialMessage: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  rows={3}
                  placeholder="Si proporcionas un mensaje, se iniciará una conversación y se enviará este mensaje al contacto..."
                />
                <p className="text-xs text-text-secondary mt-1">
                  Si el contacto no tiene conversación, se creará una y se enviará este mensaje.
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (editingContact ? 'Actualizando...' : 'Creando...') : (editingContact ? 'Actualizar' : 'Crear')}
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

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <User size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay contactos. Crea tu primer contacto para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 bg-panel border border-border rounded-md hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {contact.name} {contact.lastName || ''}
                  </h3>
                  <div className="space-y-1 text-sm text-text-secondary">
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span>{contact.phone}</span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    {contact.city && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span>{contact.city}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="p-2 text-text-secondary hover:text-primary hover:bg-background rounded-md transition-colors"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 text-text-secondary hover:text-error hover:bg-background rounded-md transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-text-secondary pt-3 border-t border-border">
                <span>{contact._count.conversations} conversaciones</span>
                <span>
                  {new Date(contact.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

