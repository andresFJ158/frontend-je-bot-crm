'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { ShoppingCart, Plus, Minus, Trash2, Search, X, Check, XCircle, Clock, User, MapPin, Package, Ban } from 'lucide-react';
import api from '@/lib/api';

interface Branch {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
}

interface Contact {
  id: string;
  name: string;
  lastName?: string;
  phone: string;
  city?: string;
}

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
  category?: Category;
}

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  branchId: string;
  userId?: string;
  agentId?: string;
  agent?: {
    id: string;
    name: string;
  } | null;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  branch?: Branch;
  user?: Contact;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  product?: Product;
}

type ViewMode = 'pos' | 'list';

export default function OrdersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('pos');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { socket } = useStore();

  useEffect(() => {
    loadBranches();
    loadContacts();
    loadProducts();
    loadCategories();
    if (viewMode === 'list') {
      loadOrders();
    }
  }, [viewMode]);

  // Listen for new orders via WebSocket to update the list in real-time
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order: any) => {
      // Reload orders list when a new order is created (including from bot)
      if (viewMode === 'list') {
        loadOrders();
      }
    };

    socket.on('new_order', handleNewOrder);

    return () => {
      socket.off('new_order', handleNewOrder);
    };
  }, [socket, viewMode]);

  const loadBranches = async () => {
    try {
      const response = await api.get('/branches?activeOnly=true');
      setBranches(response.data);
      if (response.data.length > 0 && !selectedBranch) {
        setSelectedBranch(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await api.get('/contacts');
      setContacts(response.data);
    } catch (error) {
      console.error('Error loading contacts:', error);
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

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/flat');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategoryId || product.category?.id === filterCategoryId;
    return matchesSearch && matchesCategory && product.stock > 0;
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        setError(`No hay suficiente stock. Disponible: ${product.stock}`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          product,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
        },
      ]);
    }
    setError('');
  };

  const updateCartItem = (productId: string, quantity: number) => {
    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          const product = products.find((p) => p.id === productId);
          if (quantity > (product?.stock || 0)) {
            setError(`No hay suficiente stock. Disponible: ${product?.stock || 0}`);
            return item;
          }
          const newQuantity = Math.max(1, quantity);
          return {
            ...item,
            quantity: newQuantity,
            subtotal: newQuantity * item.unitPrice,
          };
        }
        return item;
      })
    );
    setError('');
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setTax(0);
    setNotes('');
    setSelectedContact('');
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const total = Math.max(0, subtotal - discount + tax);
    return { subtotal, total };
  };

  const handleCreateOrder = async () => {
    if (!selectedBranch) {
      setError('Debes seleccionar una sucursal');
      return;
    }

    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { subtotal } = calculateTotals();
      const response = await api.post('/orders', {
        branchId: selectedBranch,
        userId: selectedContact || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        discount,
        tax,
        notes: notes || undefined,
      });

      setSuccess('Pedido creado exitosamente');
      clearCart();
      setTimeout(() => {
        setSuccess('');
        if (viewMode === 'list') {
          loadOrders();
        }
      }, 3000);
    } catch (error: any) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.message ||
        (Array.isArray(error.response?.data?.message)
          ? error.response.data.message.join(', ')
          : 'Error al crear el pedido');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETADO':
        return 'bg-green-500/20 text-green-500';
      case 'PAGO_RECIBIDO':
        return 'bg-blue-500/20 text-blue-500';
      case 'PENDIENTE_DE_PAGO':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'CANCELADO':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-yellow-500/20 text-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETADO':
        return <Check size={16} />;
      case 'PAGO_RECIBIDO':
        return <Clock size={16} />;
      case 'PENDIENTE_DE_PAGO':
        return <Clock size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETADO':
        return 'Completado';
      case 'PAGO_RECIBIDO':
        return 'Pago Recibido';
      case 'PENDIENTE_DE_PAGO':
        return 'Pendiente de Pago';
      default:
        return status;
    }
  };

  const { subtotal, total } = calculateTotals();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart size={28} />
          Sistema POS - Pedidos
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('pos')}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'pos'
                ? 'bg-primary text-white'
                : 'bg-panel border border-border text-text-secondary hover:bg-background'
            }`}
          >
            Nuevo Pedido
          </button>
          <button
            onClick={() => {
              setViewMode('list');
              loadOrders();
            }}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-panel border border-border text-text-secondary hover:bg-background'
            }`}
          >
            Lista de Pedidos
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-md text-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-md text-green-500">
          {success}
        </div>
      )}

      {viewMode === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Productos */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-panel border border-border rounded-md p-4">
              <h2 className="text-lg font-semibold mb-4">Productos</h2>

              {/* Filtros */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md"
                  />
                </div>
                <select
                  value={filterCategoryId}
                  onChange={(e) => {
                    setFilterCategoryId(e.target.value);
                    loadProducts();
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de Productos */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className={`p-3 bg-background border border-border rounded-md text-left hover:border-primary/50 transition-colors ${
                      product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1 truncate">{product.name}</div>
                    <div className="text-primary font-bold text-lg mb-1">
                      Bs.{product.price.toFixed(2)}
                    </div>
                    <div className={`text-xs ${
                      product.stock === 0 ? 'text-red-500' :
                      product.stock < 10 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      Stock: {product.stock}
                    </div>
                  </button>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  <Package size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No hay productos disponibles</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel del Carrito */}
          <div className="space-y-4">
            <div className="bg-panel border border-border rounded-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Carrito
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Limpiar
                  </button>
                )}
              </div>

              {/* Selección de Sucursal */}
              <div className="mb-4">
                <label className="block text-sm mb-1">Sucursal *</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                  required
                >
                  <option value="">Seleccionar sucursal</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de Cliente */}
              <div className="mb-4">
                <label className="block text-sm mb-1">Cliente (Opcional)</label>
                <select
                  value={selectedContact}
                  onChange={(e) => setSelectedContact(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                >
                  <option value="">Sin cliente</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} {contact.lastName || ''} - {contact.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items del Carrito */}
              <div className="space-y-2 mb-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary text-sm">
                    <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                    <p>El carrito está vacío</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="p-3 bg-background border border-border rounded-md">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{item.product.name}</div>
                          <div className="text-xs text-text-secondary">
                            Bs.{item.unitPrice.toFixed(2)} c/u
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                          className="p-1 bg-panel border border-border rounded hover:bg-background"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.product.stock}
                          value={item.quantity}
                          onChange={(e) =>
                            updateCartItem(item.productId, parseInt(e.target.value) || 1)
                          }
                          className="w-16 px-2 py-1 bg-background border border-border rounded text-center text-sm"
                        />
                        <button
                          onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                          className="p-1 bg-panel border border-border rounded hover:bg-background"
                        >
                          <Plus size={14} />
                        </button>
                        <div className="ml-auto font-semibold">
                          Bs.{item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totales */}
              <div className="space-y-2 mb-4 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-semibold">Bs.{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Descuento:</span>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 bg-background border border-border rounded text-sm text-right"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Impuestos:</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax}
                    onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 bg-background border border-border rounded text-sm text-right"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                  <span>Total:</span>
                  <span className="text-primary">Bs.{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Notas */}
              <div className="mb-4">
                <label className="block text-sm mb-1">Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
                  rows={2}
                  placeholder="Notas adicionales..."
                />
              </div>

              {/* Botón de Crear Pedido */}
              <button
                onClick={handleCreateOrder}
                disabled={loading || !selectedBranch || cart.length === 0}
                className="w-full px-4 py-3 bg-primary text-white rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creando...' : `Crear Pedido - Bs.${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Vista de Lista de Pedidos */
        <div className="bg-panel border border-border rounded-md p-4">
          <h2 className="text-lg font-semibold mb-4">Lista de Pedidos</h2>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                <p>No hay pedidos registrados</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 bg-background border border-border rounded-md hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-text-secondary">#{order.id.substring(0, 8)}</span>
                        {!order.agent && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-500 text-xs font-semibold rounded">
                            🤖 Bot
                          </span>
                        )}
                        <select
                          value={order.status}
                          onChange={async (e) => {
                            try {
                              await api.patch(`/orders/${order.id}`, { status: e.target.value });
                              await loadOrders();
                            } catch (error: any) {
                              const errorMessage = error.response?.data?.message || 'Error al actualizar el estado';
                              setError(errorMessage);
                              setTimeout(() => setError(''), 3000);
                            }
                          }}
                          disabled={order.status === 'COMPLETADO' || order.status === 'CANCELADO'}
                          className={`px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer ${getStatusColor(order.status)} ${
                            (order.status === 'COMPLETADO' || order.status === 'CANCELADO') ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="PENDIENTE_DE_PAGO">Pendiente de Pago</option>
                          <option value="PAGO_RECIBIDO">Pago Recibido</option>
                          <option value="COMPLETADO">Completado</option>
                          <option value="CANCELADO">Cancelado</option>
                        </select>
                        {order.status !== 'COMPLETADO' && order.status !== 'CANCELADO' && (
                          <button
                            onClick={async () => {
                              if (!confirm('¿Estás seguro de que quieres cancelar este pedido? Se revertirá el inventario.')) {
                                return;
                              }
                              try {
                                setLoading(true);
                                await api.post(`/orders/${order.id}/cancel`);
                                await loadOrders();
                                setSuccess('Pedido cancelado exitosamente');
                                setTimeout(() => setSuccess(''), 3000);
                              } catch (error: any) {
                                const errorMessage = error.response?.data?.message || 'Error al cancelar el pedido';
                                setError(errorMessage);
                                setTimeout(() => setError(''), 3000);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="px-3 py-1 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <Ban size={14} />
                            Cancelar
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        {order.branch && (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            {order.branch.name}
                          </div>
                        )}
                        {order.user && (
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            {order.user.name} {order.user.lastName || ''}
                          </div>
                        )}
                        <div>
                          {new Date(order.createdAt).toLocaleString('es-ES')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        Bs.{order.total.toFixed(2)}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {order.items?.length || 0} items
                      </div>
                    </div>
                  </div>
                  {order.notes && (
                    <div className="text-sm text-text-secondary mb-2 italic">
                      {order.notes}
                    </div>
                  )}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-xs font-semibold mb-2">Items:</div>
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-xs text-text-secondary">
                            <span>
                              {item.product?.name} x{item.quantity}
                            </span>
                            <span>Bs.{(item.quantity * item.unitPrice - item.discount).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

