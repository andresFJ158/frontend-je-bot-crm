'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
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
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryId: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');

  useEffect(() => {
    loadCategories();
    loadProducts();
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
      const params = new URLSearchParams();
      if (filterCategoryId) params.append('categoryId', filterCategoryId);

      const url = params.toString() ? `/products?${params.toString()}` : '/products';
      const response = await api.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/products', {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        categoryId: formData.categoryId || undefined,
      });
      await loadProducts();
      setShowCreate(false);
      setFormData({ name: '', price: '', categoryId: '', description: '' });
    } catch (error: any) {
      console.error('Error creating product:', error);
      const errorMessage = error.response?.data?.message ||
        (Array.isArray(error.response?.data?.message)
          ? error.response.data.message.join(', ')
          : 'Error al crear el producto');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      categoryId: product.categoryId || '',
      description: product.description,
    });
    setShowCreate(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setLoading(true);
    setError('');

    try {
      await api.patch(`/products/${editingProduct.id}`, {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        categoryId: formData.categoryId || undefined,
      });
      await loadProducts();
      setShowCreate(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', categoryId: '', description: '' });
    } catch (error: any) {
      console.error('Error updating product:', error);
      const errorMessage = error.response?.data?.message ||
        (Array.isArray(error.response?.data?.message)
          ? error.response.data.message.join(', ')
          : 'Error al actualizar el producto');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      await loadProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert(error.response?.data?.message || 'Error al eliminar el producto');
    }
  };

  const handleCancel = () => {
    setShowCreate(false);
    setEditingProduct(null);
    setFormData({ name: '', price: '', categoryId: '', description: '' });
    setError('');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', price: '', categoryId: '', description: '' });
            setError('');
            setShowCreate(!showCreate);
          }}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus size={20} />
          <span>{editingProduct ? 'Cancelar Edición' : 'Nuevo Producto'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Filtrar por categoría</label>
        <select
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-md"
        >
          <option value="">Todas las categorías</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {getCategoryPath(category)}
            </option>
          ))}
        </select>
      </div>

      {showCreate && (
        <div className="mb-6 p-4 bg-panel border border-border rounded-md">
          <h2 className="text-lg font-semibold mb-4">
            {editingProduct ? 'Editar Producto' : 'Crear Producto'}
          </h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={editingProduct ? handleUpdate : handleCreate} className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  required
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-2">
                El stock se calcula automáticamente mediante las transacciones de inventario (entradas y salidas).
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Categoría</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
              >
                <option value="">Sin categoría</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {getCategoryPath(category)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
                rows={4}
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (editingProduct ? 'Actualizando...' : 'Creando...') : (editingProduct ? 'Actualizar' : 'Crear')}
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

      {products.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay productos. Crea tu primer producto para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="p-4 bg-panel border border-border rounded-md hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <div>
                    <p className="text-primary font-bold text-xl mb-1">
                      Bs.{product.price.toFixed(2)}
                    </p>
                    <p className={`text-sm font-medium ${
                      product.stock === 0 ? 'text-red-500' : 
                      product.stock < 10 ? 'text-yellow-500' : 
                      'text-green-500'
                    }`}>
                      Stock: {product.stock}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 text-text-secondary hover:text-primary hover:bg-background rounded-md transition-colors"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-text-secondary hover:text-error hover:bg-background rounded-md transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="mb-2 flex gap-2 flex-wrap">
                {product.category ? (
                  <span className="text-xs px-2 py-1 bg-background rounded-md text-text-secondary">
                    {getCategoryPath(product.category)}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-background rounded-md text-text-secondary">
                    Sin categoría
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary line-clamp-3">
                {product.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

