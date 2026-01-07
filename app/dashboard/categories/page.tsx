'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
  };
  children?: Category[];
  depth?: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
    children: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');

  useEffect(() => {
    loadCategories();
    loadFlatCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/tree');
      setCategories(response.data);
      // Expandir todas las categorías por defecto
      const allIds = new Set<string>();
      const collectIds = (cats: Category[]) => {
        cats.forEach((cat) => {
          allIds.add(cat.id);
          if (cat.children && cat.children.length > 0) {
            collectIds(cat.children);
          }
        });
      };
      collectIds(response.data);
      setExpandedCategories(allIds);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadFlatCategories = async () => {
    try {
      const response = await api.get('/categories/flat');
      setFlatCategories(response.data);
    } catch (error) {
      console.error('Error loading flat categories:', error);
    }
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryPath = (category: Category): string => {
    const path: string[] = [];
    let current: Category | undefined = category;

    while (current) {
      path.unshift(current.name);
      if (current.parentId && flatCategories.length > 0) {
        current = flatCategories.find((c) => c.id === current.parentId);
      } else {
        break;
      }
    }

    return path.join(' > ');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/categories', {
        ...formData,
        parentId: formData.parentId || undefined,
      });
      await loadCategories();
      await loadFlatCategories();
      setShowForm(false);
      setFormData({ name: '', description: '', parentId: '' });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al crear la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setLoading(true);
    setError('');

    try {
      await api.patch(`/categories/${editingCategory.id}`, {
        ...formData,
        parentId: formData.parentId || undefined,
      });
      await loadCategories();
      await loadFlatCategories();
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', parentId: '' });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al actualizar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      await loadCategories();
      await loadFlatCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al eliminar la categoría');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId || '',
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', parentId: '' });
    setError('');
  };

  const renderCategoryTree = (categories: Category[], level: number = 0): JSX.Element[] => {
    return categories.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);
      const indent = level * 24;

      return (
        <div key={category.id}>
          <div
            className={`p-3 bg-panel border border-border rounded-md mb-2 hover:border-primary/50 transition-colors ${
              level > 0 ? 'ml-4' : ''
            }`}
            style={{ marginLeft: `${indent}px` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 flex items-center gap-2">
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(category.id)}
                    className="p-1 hover:bg-background rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-text-secondary" />
                    ) : (
                      <ChevronRight size={16} className="text-text-secondary" />
                    )}
                  </button>
                ) : (
                  <div className="w-6" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    {category.depth !== undefined && (
                      <span className="text-xs px-2 py-1 bg-background rounded-md text-text-secondary">
                        Nivel {category.depth}
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-sm text-text-secondary mb-2">{category.description}</p>
                  )}
                  {category.parent && (
                    <p className="text-xs text-text-secondary mb-2">
                      Padre: {category.parent.name}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm text-text-secondary">
                    <span>{category._count.products} productos</span>
                    <span>{category._count.children} hijos</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 text-text-secondary hover:text-primary hover:bg-background rounded-md transition-colors"
                  title="Editar"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 text-text-secondary hover:text-error hover:bg-background rounded-md transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderCategoryTree(category.children!, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'tree' ? 'flat' : 'tree')}
            className="px-4 py-2 bg-background border border-border rounded-md hover:bg-panel"
          >
            {viewMode === 'tree' ? 'Vista Plana' : 'Vista Árbol'}
          </button>
          <button
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', description: '', parentId: '' });
              setError('');
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Category Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-panel border border-border rounded-md">
          <h2 className="text-lg font-semibold mb-4">
            {editingCategory ? 'Editar Categoría' : 'Crear Categoría'}
          </h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={editingCategory ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoría Padre (Opcional)</label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
              >
                <option value="">Sin categoría padre (Nivel raíz)</option>
                {flatCategories
                  .filter((cat) => !editingCategory || cat.id !== editingCategory.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {getCategoryPath(cat)}
                    </option>
                  ))}
              </select>
              {formData.parentId && (
                <p className="text-xs text-text-secondary mt-1">
                  Máximo 5 niveles de anidación
                </p>
              )}
            </div>
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
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading
                  ? editingCategory
                    ? 'Actualizando...'
                    : 'Creando...'
                  : editingCategory
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

      {/* Categories List */}
      {viewMode === 'tree' ? (
        categories.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <Folder size={48} className="mx-auto mb-4 opacity-50" />
            <p>No hay categorías. Crea tu primera categoría para comenzar.</p>
          </div>
        ) : (
          <div>{renderCategoryTree(categories)}</div>
        )
      ) : (
        flatCategories.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <Folder size={48} className="mx-auto mb-4 opacity-50" />
            <p>No hay categorías. Crea tu primera categoría para comenzar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flatCategories.map((category) => (
              <div
                key={category.id}
                className="p-4 bg-panel border border-border rounded-md hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                    {category.parent && (
                      <p className="text-xs text-text-secondary mb-2">
                        Padre: {category.parent.name}
                      </p>
                    )}
                    {category.description && (
                      <p className="text-sm text-text-secondary mb-2">{category.description}</p>
                    )}
                    <p className="text-xs text-text-secondary mb-2">
                      Ruta: {getCategoryPath(category)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-text-secondary hover:text-primary hover:bg-background rounded-md transition-colors"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-text-secondary hover:text-error hover:bg-background rounded-md transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-text-secondary pt-3 border-t border-border">
                  <span>{category._count.products} productos</span>
                  <span>{category._count.children} hijos</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
