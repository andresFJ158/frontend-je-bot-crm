'use client';

import { useEffect, useState } from 'react';
import { Plus, ArrowDown, ArrowUp, Package, Filter } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Category {
  id: string;
  name: string;
  parent?: Category;
}

interface Product {
  id: string;
  name: string;
  stock: number;
  category?: Category;
}

interface Agent {
  id: string;
  name: string;
}

interface InventoryTransaction {
  id: string;
  productId: string;
  type: 'ENTRADA' | 'SALIDA';
  quantity: number;
  glosa?: string;
  agentId?: string;
  createdAt: string;
  product: Product;
  agent?: Agent;
}

export default function InventoryPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    type: 'ENTRADA' as 'ENTRADA' | 'SALIDA',
    quantity: '',
    glosa: '',
    agentId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    productId: '',
    type: '',
    agentId: '',
  });
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadTransactions();
    loadProducts();
    loadAgents();
    loadSummary();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.productId) params.append('productId', filters.productId);
      if (filters.type) params.append('type', filters.type);
      if (filters.agentId) params.append('agentId', filters.agentId);

      const response = await api.get(`/inventory/transactions?${params.toString()}`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
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

  const loadAgents = async () => {
    try {
      const response = await api.get('/agents');
      setAgents(response.data);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await api.get('/inventory/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        productId: formData.productId,
        type: formData.type,
        quantity: parseInt(formData.quantity),
        glosa: formData.type === 'SALIDA' ? formData.glosa : undefined,
        agentId: formData.agentId || undefined,
      };

      await api.post('/inventory/transactions', payload);
      await loadTransactions();
      await loadSummary();
      setShowForm(false);
      setFormData({
        productId: '',
        type: 'ENTRADA',
        quantity: '',
        glosa: '',
        agentId: '',
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al crear la transacción');
    } finally {
      setLoading(false);
    }
  };

  const getProductStock = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.stock || 0;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <button
          onClick={() => {
            setFormData({
              productId: '',
              type: 'ENTRADA',
              quantity: '',
              glosa: '',
              agentId: '',
            });
            setError('');
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Nueva Transacción</span>
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-panel border border-border rounded-md">
            <div className="text-sm text-text-secondary mb-1">Total Productos</div>
            <div className="text-2xl font-bold">{summary.totalProducts}</div>
          </div>
          <div className="p-4 bg-panel border border-border rounded-md">
            <div className="text-sm text-text-secondary mb-1">Stock Bajo</div>
            <div className="text-2xl font-bold text-yellow-500">{summary.lowStockProducts}</div>
          </div>
          <div className="p-4 bg-panel border border-border rounded-md">
            <div className="text-sm text-text-secondary mb-1">Sin Stock</div>
            <div className="text-2xl font-bold text-red-500">{summary.outOfStockProducts}</div>
          </div>
          <div className="p-4 bg-panel border border-border rounded-md">
            <div className="text-sm text-text-secondary mb-1">Valor Total</div>
            <div className="text-2xl font-bold">Bs.{summary.totalStockValue.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-panel border border-border rounded-md">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} />
          <h3 className="font-semibold">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Producto</label>
            <select
              value={filters.productId}
              onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            >
              <option value="">Todos los productos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (Stock: {product.stock})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tipo</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            >
              <option value="">Todos los tipos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Agente</label>
            <select
              value={filters.agentId}
              onChange={(e) => setFilters({ ...filters, agentId: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            >
              <option value="">Todos los agentes</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-panel border border-border rounded-md">
          <h2 className="text-lg font-semibold mb-4">Nueva Transacción</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Producto</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock: {product.stock})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'ENTRADA' | 'SALIDA' })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  required
                >
                  <option value="ENTRADA">Entrada (Reposición stock)</option>
                  <option value="SALIDA">Salida</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  required
                />
                {formData.productId && formData.type === 'SALIDA' && (
                  <p className="text-xs text-text-secondary mt-1">
                    Stock disponible: {getProductStock(formData.productId)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Agente (Opcional)</label>
                <select
                  value={formData.agentId}
                  onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                >
                  <option value="">Sin asignar</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {formData.type === 'SALIDA' && (
              <div>
                <label className="block text-sm font-medium mb-2">Glosa (Razón de la salida)</label>
                <textarea
                  value={formData.glosa}
                  onChange={(e) => setFormData({ ...formData, glosa: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  rows={3}
                  placeholder="Describe la razón de la salida de productos..."
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Transacción'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    productId: '',
                    type: 'ENTRADA',
                    quantity: '',
                    glosa: '',
                    agentId: '',
                  });
                  setError('');
                }}
                className="px-4 py-2 bg-background border border-border rounded-md"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay transacciones. Crea tu primera transacción para comenzar.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Producto</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-left p-3">Cantidad</th>
                <th className="text-left p-3">Glosa</th>
                <th className="text-left p-3">Agente</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-border hover:bg-panel">
                  <td className="p-3 text-sm">
                    {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{transaction.product.name}</div>
                      <div className="text-xs text-text-secondary">
                        {(() => {
                          if (!transaction.product.category) return 'Sin categoría';
                          const path: string[] = [];
                          let current: Category | undefined = transaction.product.category;
                          while (current) {
                            path.unshift(current.name);
                            current = current.parent;
                          }
                          return path.join(' > ');
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm ${
                        transaction.type === 'ENTRADA'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-red-500/20 text-red-500'
                      }`}
                    >
                      {transaction.type === 'ENTRADA' ? (
                        <ArrowDown size={16} />
                      ) : (
                        <ArrowUp size={16} />
                      )}
                      {transaction.type}
                    </span>
                  </td>
                  <td className="p-3 font-medium">{transaction.quantity}</td>
                  <td className="p-3 text-sm text-text-secondary">
                    {transaction.glosa || (transaction.type === 'ENTRADA' ? 'Reposición stock' : '-')}
                  </td>
                  <td className="p-3 text-sm text-text-secondary">
                    {transaction.agent?.name || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

