'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Edit, Trash2, QrCode, CreditCard, Save, X, Upload, XCircle } from 'lucide-react';
import api from '@/lib/api';

interface PaymentMethod {
  id: string;
  type: 'QR' | 'BANK_ACCOUNT';
  name: string;
  description?: string;
  qrImageUrl?: string;
  bankName?: string;
  accountNumber?: string;
  accountType?: 'AHORROS' | 'CORRIENTE';
  cci?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'QR' as 'QR' | 'BANK_ACCOUNT',
    name: '',
    description: '',
    qrImageUrl: '',
    bankName: '',
    accountNumber: '',
    accountType: 'AHORROS' as 'AHORROS' | 'CORRIENTE',
    cci: '',
    isActive: true,
    order: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await api.get('/payment-methods');
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      alert('Error al cargar los métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/payment-methods', formData);
      await loadPaymentMethods();
      setShowCreate(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating payment method:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear el método de pago';
      alert(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setLoading(true);
    try {
      await api.patch(`/payment-methods/${id}`, formData);
      await loadPaymentMethods();
      setEditingId(null);
      resetForm();
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar el método de pago';
      alert(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este método de pago?')) {
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/payment-methods/${id}`);
      await loadPaymentMethods();
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      alert('Error al eliminar el método de pago');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setFormData({
      type: method.type,
      name: method.name,
      description: method.description || '',
      qrImageUrl: method.qrImageUrl || '',
      bankName: method.bankName || '',
      accountNumber: method.accountNumber || '',
      accountType: method.accountType || 'AHORROS',
      cci: method.cci || '',
      isActive: method.isActive,
      order: method.order,
    });
    setPreviewUrl(method.qrImageUrl || null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
      alert('Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/payment-methods/upload-qr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9090'}${response.data.url}`;
      setFormData((prev) => ({ ...prev, qrImageUrl: imageUrl }));
      setPreviewUrl(imageUrl);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(error.response?.data?.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, qrImageUrl: '' }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'QR',
      name: '',
      description: '',
      qrImageUrl: '',
      bankName: '',
      accountNumber: '',
      accountType: 'AHORROS',
      cci: '',
      isActive: true,
      order: 0,
    });
    setPreviewUrl(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowCreate(false);
    resetForm();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Métodos de Pago</h1>
        <button
          onClick={() => {
            setShowCreate(true);
            resetForm();
          }}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Agregar Método</span>
        </button>
      </div>

      {(showCreate || editingId) && (
        <div className="bg-panel border border-border rounded-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
          </h2>
          <form
            onSubmit={(e) => {
              if (editingId) {
                handleUpdate(editingId);
              } else {
                handleCreate(e);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'QR' | 'BANK_ACCOUNT' })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="QR">QR</option>
                <option value="BANK_ACCOUNT">Cuenta Bancaria</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ej: QR Principal, Cuenta BCP"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descripción (opcional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Descripción del método de pago"
              />
            </div>

            {formData.type === 'QR' && (
              <div>
                <label className="block text-sm font-medium mb-2">Imagen QR</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="qr-upload"
                    />
                    <label
                      htmlFor="qr-upload"
                      className="flex-1 px-4 py-2 bg-secondary text-text rounded-md hover:bg-secondary/80 cursor-pointer flex items-center justify-center gap-2 border border-border"
                    >
                      <Upload size={18} />
                      <span>{uploading ? 'Subiendo...' : 'Subir Imagen'}</span>
                    </label>
                    {previewUrl && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
                      >
                        <XCircle size={18} />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="text-xs text-text-secondary">
                    O ingresa una URL:
                  </div>
                  
                  <input
                    type="url"
                    value={formData.qrImageUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, qrImageUrl: e.target.value });
                      setPreviewUrl(e.target.value || null);
                    }}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://ejemplo.com/qr.png"
                  />
                  
                  {(previewUrl || formData.qrImageUrl) && (
                    <div className="mt-4 relative">
                      <img
                        src={previewUrl || formData.qrImageUrl}
                        alt="QR Preview"
                        className="max-w-xs border border-border rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {formData.type === 'BANK_ACCOUNT' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del Banco</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: BCP, BBVA, Interbank"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Número de Cuenta</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Número de cuenta bancaria"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Cuenta</label>
                  <select
                    value={formData.accountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountType: e.target.value as 'AHORROS' | 'CORRIENTE',
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="AHORROS">Ahorros</option>
                    <option value="CORRIENTE">Corriente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">CCI (Código de Cuenta Interbancario)</label>
                  <input
                    type="text"
                    value={formData.cci}
                    onChange={(e) => setFormData({ ...formData, cci: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="CCI para transferencias interbancarias"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm">
                  Activo
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Orden</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-32 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={18} />
                <span>{loading ? 'Guardando...' : 'Guardar'}</span>
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-secondary text-text rounded-md hover:bg-secondary/80 flex items-center gap-2"
              >
                <X size={18} />
                <span>Cancelar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showCreate && !editingId ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="bg-panel border border-border rounded-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {method.type === 'QR' ? (
                    <QrCode size={24} className="text-primary" />
                  ) : (
                    <CreditCard size={24} className="text-primary" />
                  )}
                  <h3 className="text-lg font-bold">{method.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(method)}
                    className="p-2 hover:bg-background rounded-md"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="p-2 hover:bg-background rounded-md text-red-500"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {method.description && (
                <p className="text-sm text-text-secondary mb-4">{method.description}</p>
              )}

              {method.type === 'QR' && method.qrImageUrl && (
                <div className="mb-4">
                  <img
                    src={method.qrImageUrl}
                    alt="QR Code"
                    className="w-full max-w-xs mx-auto border border-border rounded-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {method.type === 'BANK_ACCOUNT' && (
                <div className="space-y-2 text-sm">
                  {method.bankName && (
                    <div>
                      <span className="font-medium">Banco:</span> {method.bankName}
                    </div>
                  )}
                  {method.accountNumber && (
                    <div>
                      <span className="font-medium">Cuenta:</span> {method.accountNumber}
                    </div>
                  )}
                  {method.accountType && (
                    <div>
                      <span className="font-medium">Tipo:</span> {method.accountType}
                    </div>
                  )}
                  {method.cci && (
                    <div>
                      <span className="font-medium">CCI:</span> {method.cci}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    method.isActive
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-gray-500/20 text-gray-500'
                  }`}
                >
                  {method.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <span className="text-xs text-text-secondary">Orden: {method.order}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {paymentMethods.length === 0 && !loading && (
        <div className="text-center py-8 text-text-secondary">
          No hay métodos de pago configurados. Agrega uno para comenzar.
        </div>
      )}
    </div>
  );
}

