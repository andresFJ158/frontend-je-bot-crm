'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ShoppingCart, X } from 'lucide-react';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  parent?: Category;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  categoryId?: string;
  category?: Category;
}

interface ComboItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

interface Combo {
  id: string;
  name: string;
  description: string;
  offerPrice: number;
  categoryId?: string;
  category?: Category;
  isActive: boolean;
  items: ComboItem[];
  createdAt: string;
  updatedAt: string;
}

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    offerPrice: '',
    categoryId: '',
    isActive: true,
  });
  const [comboItems, setComboItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadCombos();
  }, [filterCategoryId]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/flat');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCombos = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategoryId) params.append('categoryId', filterCategoryId);

      const url = params.toString() ? `/combos?${params.toString()}` : '/combos';
      const response = await api.get(url);
      setCombos(response.data);
    } catch (error) {
      console.error('Error loading combos:', error);
    }
  };

  const getCategoryPath = (category: Category): string => {
    const path: string[] = [];
    let current: Category | undefined = category;

    while (current) {
      path.unshift(current.name);
      current = current.parent;
    }

    return path.join(' > ');
  };

  const calculateTotalPrice = (combo: Combo): number => {
    return combo.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const calculateSavings = (combo: Combo): number => {
    const totalPrice = calculateTotalPrice(combo);
    return totalPrice - combo.offerPrice;
  };

  const addComboItem = () => {
    setComboItems([...comboItems, { productId: '', quantity: 1 }]);
  };

  const removeComboItem = (index: number) => {
    setComboItems(comboItems.filter((_, i) => i !== index));
  };

  const updateComboItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const updated = [...comboItems];
    updated[index] = { ...updated[index], [field]: value };
    setComboItems(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (comboItems.length === 0) {
      setError('Debes agregar al menos un producto al combo');
      setLoading(false);
      return;
    }

    if (comboItems.some(item => !item.productId)) {
      setError('Todos los productos deben estar seleccionados');
      setLoading(false);
      return;
    }

    try {
      await api.post('/combos', {
        name: formData.name,
        description: formData.description,
        offerPrice: parseFloat(formData.offerPrice),
        categoryId: formData.categoryId || undefined,
        isActive: formData.isActive,
        items: comboItems,
      });
      await loadCombos();
      setShowCreate(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating combo:', error);
      const errorMessage = error.response?.data?.message ||
        (Array.isArray(error.response?.data?.message)
          ? error.response.data.message.join(', ')
          : 'Error al crear el combo');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (combo: Combo) => {
    setEditingCombo(combo);
    setFormData({
      name: combo.name,
      description: combo.description,
      offerPrice: combo.offerPrice.toString(),
      categoryId: combo.categoryId || '',
      isActive: combo.isActive,
    });
    setComboItems(combo.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    })));
    setShowCreate(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCombo) return;

    setLoading(true);
    setError('');

    if (comboItems.length === 0) {
      setError('Debes agregar al menos un producto al combo');
      setLoading(false);
      return;
    }

    if (comboItems.some(item => !item.productId)) {
      setError('Todos los productos deben estar seleccionados');
      setLoading(false);
      return;
    }

    try {
      await api.patch(`/combos/${editingCombo.id}`, {
        name: formData.name,
        description: formData.description,
        offerPrice: parseFloat(formData.offerPrice),
        categoryId: formData.categoryId || undefined,
        isActive: formData.isActive,
        items: comboItems,
      });
      await loadCombos();
      setShowCreate(false);
      setEditingCombo(null);
      resetForm();
    } catch (error: any) {
      console.error('Error updating combo:', error);
      const errorMessage = error.response?.data?.message ||
        (Array.isArray(error.response?.data?.message)
          ? error.response.data.message.join(', ')
          : 'Error al actualizar el combo');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este combo?')) {
      return;
    }

    try {
      await api.delete(`/combos/${id}`);
      await loadCombos();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar el combo');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      offerPrice: '',
      categoryId: '',
      isActive: true,
    });
    setComboItems([]);
    setError('');
  };

  const handleCancel = () => {
    setShowCreate(false);
    setEditingCombo(null);
    resetForm();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Combos</h1>
        <button
          onClick={() => {
            setEditingCombo(null);
            resetForm();
            setShowCreate(!showCreate);
          }}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Nuevo Combo</span>
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6 p-4 bg-panel border border-border rounded-md">
        <label className="block text-sm font-medium mb-2">Filtrar por Categoría</label>
        <select
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
          className="w-full md:w-64 px-3 py-2 bg-background border border-border rounded-md"
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {getCategoryPath(category)}
            </option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showCreate && (
        <div className="mb-6 p-4 bg-panel border border-border rounded-md">
          <h2 className="text-lg font-semibold mb-4">
            {editingCombo ? 'Editar Combo' : 'Crear Combo'}
          </h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={editingCombo ? handleUpdate : handleCreate} className="space-y-4">
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
                <label className="block text-sm font-medium mb-2">Precio de Oferta</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.offerPrice}
                  onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  required
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
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Categoría</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getCategoryPath(category)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Activo</span>
                </label>
              </div>
            </div>

            {/* Combo Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Productos del Combo</label>
                <button
                  type="button"
                  onClick={addComboItem}
                  className="px-3 py-1 text-sm bg-background border border-border rounded-md hover:bg-background/80"
                >
                  <Plus size={16} className="inline mr-1" />
                  Agregar Producto
                </button>
              </div>
              {comboItems.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={item.productId}
                    onChange={(e) => updateComboItem(index, 'productId', e.target.value)}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-md"
                    required
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ${product.price}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateComboItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2 bg-background border border-border rounded-md"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeComboItem(index)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {comboItems.length === 0 && (
                <p className="text-sm text-text-secondary">No hay productos agregados. Haz clic en &quot;Agregar Producto&quot; para comenzar.</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (editingCombo ? 'Actualizando...' : 'Creando...') : (editingCombo ? 'Actualizar' : 'Crear')}
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

      {/* Combos List */}
      {combos.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay combos. Crea tu primer combo para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combos.map((combo) => {
            const totalPrice = calculateTotalPrice(combo);
            const savings = calculateSavings(combo);
            return (
              <div
                key={combo.id}
                className={`p-4 border rounded-md ${
                  combo.isActive
                    ? 'bg-panel border-border hover:border-primary/50'
                    : 'bg-panel/50 border-border/50 opacity-60'
                } transition-colors`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{combo.name}</h3>
                    <p className="text-sm text-text-secondary mb-2 line-clamp-2">{combo.description}</p>
                    {combo.category && (
                      <p className="text-xs text-text-secondary mb-2">
                        {getCategoryPath(combo.category)}
                      </p>
                    )}
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Precio total:</span>
                        <span className="line-through text-text-secondary">${totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Precio oferta:</span>
                        <span className="font-bold text-primary">${combo.offerPrice.toFixed(2)}</span>
                      </div>
                      {savings > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary">Ahorro:</span>
                          <span className="font-semibold text-green-600">${savings.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-medium text-text-secondary mb-1">Productos incluidos:</p>
                      <ul className="text-xs text-text-secondary space-y-1">
                        {combo.items.map((item) => (
                          <li key={item.id}>
                            {item.quantity}x {item.product.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(combo)}
                      className="p-2 text-text-secondary hover:text-primary hover:bg-background rounded-md transition-colors"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(combo.id)}
                      className="p-2 text-text-secondary hover:text-error hover:bg-background rounded-md transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {!combo.isActive && (
                  <div className="mt-2 text-xs text-text-secondary italic">(Inactivo)</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

