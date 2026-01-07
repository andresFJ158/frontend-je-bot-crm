'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Edit, Trash2, MapPin, Navigation } from 'lucide-react';
import api from '@/lib/api';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/BranchMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center">Cargando mapa...</div>,
});

interface Branch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  openingHours?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    openingHours: '',
    description: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([-16.5000, -68.1500]); // Default: La Paz, Bolivia
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  useEffect(() => {
    loadBranches();
    // Get user location for map center
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Use default if geolocation fails
        }
      );
    }
  }, []);

  const loadBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/branches', {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        isActive: formData.isActive,
      });
      await loadBranches();
      setShowCreate(false);
      setFormData({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        phone: '',
        openingHours: '',
        description: '',
        isActive: true,
      });
    } catch (error: any) {
      console.error('Error creating branch:', error);
      const errorMessage = error.response?.data?.message ||
        (Array.isArray(error.response?.data?.message)
          ? error.response.data.message.join(', ')
          : 'Error al crear la sucursal');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      latitude: branch.latitude.toString(),
      longitude: branch.longitude.toString(),
      phone: branch.phone || '',
      openingHours: branch.openingHours || '',
      description: branch.description || '',
      isActive: branch.isActive,
    });
    setShowCreate(true);
    setMapCenter([branch.latitude, branch.longitude]);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    setLoading(true);
    setError('');

    try {
      await api.patch(`/branches/${editingBranch.id}`, {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        isActive: formData.isActive,
      });
      await loadBranches();
      setShowCreate(false);
      setEditingBranch(null);
      setFormData({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        phone: '',
        openingHours: '',
        description: '',
        isActive: true,
      });
    } catch (error: any) {
      console.error('Error updating branch:', error);
      const errorMessage = error.response?.data?.message ||
        (Array.isArray(error.response?.data?.message)
          ? error.response.data.message.join(', ')
          : 'Error al actualizar la sucursal');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta sucursal?')) {
      return;
    }

    try {
      await api.delete(`/branches/${id}`);
      await loadBranches();
    } catch (error: any) {
      console.error('Error deleting branch:', error);
      alert(error.response?.data?.message || 'Error al eliminar la sucursal');
    }
  };

  const handleCancel = () => {
    setShowCreate(false);
    setEditingBranch(null);
    setFormData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      phone: '',
      openingHours: '',
      description: '',
      isActive: true,
    });
    setError('');
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (showCreate) {
      setFormData({
        ...formData,
        latitude: lat.toString(),
        longitude: lng.toString(),
      });
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sucursales</h1>
        <button
          onClick={() => {
            setEditingBranch(null);
            setFormData({
              name: '',
              address: '',
              latitude: '',
              longitude: '',
              phone: '',
              openingHours: '',
              description: '',
              isActive: true,
            });
            setError('');
            setShowCreate(!showCreate);
          }}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus size={20} />
          <span>{editingBranch ? 'Cancelar Edición' : 'Nueva Sucursal'}</span>
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Left Panel - Form and List */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          {showCreate && (
            <div className="p-4 bg-panel border border-border rounded-md">
              <h2 className="text-lg font-semibold mb-4">
                {editingBranch ? 'Editar Sucursal' : 'Crear Sucursal'}
              </h2>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={editingBranch ? handleUpdate : handleCreate} className="space-y-4">
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
                  <label className="block text-sm font-medium mb-2">Dirección</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Teléfono</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Horarios de Atención (Opcional)</label>
                    <textarea
                      value={formData.openingHours}
                      onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md"
                      rows={3}
                      placeholder="Ej: Lunes a Viernes: 9:00 - 18:00&#10;Sábados: 9:00 - 13:00&#10;Domingos: Cerrado"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Activa</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? (editingBranch ? 'Actualizando...' : 'Creando...') : (editingBranch ? 'Actualizar' : 'Crear')}
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

          <div className="space-y-2">
            {branches.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                <p>No hay sucursales. Crea tu primera sucursal para comenzar.</p>
              </div>
            ) : (
              branches.map((branch) => (
                <div
                  key={branch.id}
                  className={`p-4 bg-panel border border-border rounded-md hover:border-primary/50 transition-colors cursor-pointer ${selectedBranch?.id === branch.id ? 'border-primary' : ''
                    }`}
                  onClick={() => {
                    setSelectedBranch(branch);
                    setMapCenter([branch.latitude, branch.longitude]);
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{branch.name}</h3>
                      <p className="text-sm text-text-secondary">{branch.address}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(branch);
                        }}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-background rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(branch.id);
                        }}
                        className="p-2 text-text-secondary hover:text-error hover:bg-background rounded-md transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    {branch.phone && <span>📞 {branch.phone}</span>}
                    <span className={branch.isActive ? 'text-success' : 'text-error'}>
                      {branch.isActive ? '● Activa' : '● Inactiva'}
                    </span>
                  </div>
                  {branch.openingHours && (
                    <div className="text-xs text-text-secondary mt-2">
                      <span className="font-medium">🕐 Horarios:</span>
                      <pre className="whitespace-pre-wrap mt-1 text-xs">{branch.openingHours}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="bg-panel border border-border rounded-md overflow-hidden">
          <MapComponent
            branches={branches}
            center={mapCenter}
            selectedBranch={selectedBranch}
            onMapClick={handleMapClick}
            onMarkerClick={(branch) => {
              // Find the full branch object with all properties
              const fullBranch = branches.find(b => b.id === branch.id);
              if (fullBranch) {
                setSelectedBranch(fullBranch);
                setMapCenter([fullBranch.latitude, fullBranch.longitude]);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

