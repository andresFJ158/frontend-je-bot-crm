'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MessageSquare, Users, Settings, BarChart3, LogOut, Smartphone, Package, MapPin, FolderTree, Warehouse, Contact, Zap, ShoppingCart, ChevronDown, ChevronRight, CreditCard, Menu, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  showBadge?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { agent, setAgent, setToken, disconnectSocket, conversations, socket } = useStore();

  // Estado para controlar qué secciones están expandidas
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);

  // Calculate total unread messages
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // Load pending orders count (PENDIENTE_DE_PAGO and PAGO_RECIBIDO)
  useEffect(() => {
    const loadPendingOrders = async () => {
      try {
        // Get orders with status PENDIENTE_DE_PAGO or PAGO_RECIBIDO
        const [pendingResponse, receivedResponse] = await Promise.all([
          api.get('/orders?status=PENDIENTE_DE_PAGO'),
          api.get('/orders?status=PAGO_RECIBIDO'),
        ]);

        const pendingCount = pendingResponse.data?.length || 0;
        const receivedCount = receivedResponse.data?.length || 0;
        const totalCount = pendingCount + receivedCount;

        console.log('Loading pending orders - PENDIENTE_DE_PAGO:', pendingCount, 'PAGO_RECIBIDO:', receivedCount, 'Total:', totalCount);
        setPendingOrdersCount(totalCount);
      } catch (error) {
        console.error('Error loading pending orders:', error);
      }
    };

    loadPendingOrders();

    // Reload every 30 seconds
    const interval = setInterval(loadPendingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for new orders and order updates
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = () => {
      // Reload pending orders count when a new order is created or updated
      Promise.all([
        api.get('/orders?status=PENDIENTE_DE_PAGO'),
        api.get('/orders?status=PAGO_RECIBIDO'),
      ])
        .then(([pendingResponse, receivedResponse]) => {
          const pendingCount = pendingResponse.data?.length || 0;
          const receivedCount = receivedResponse.data?.length || 0;
          setPendingOrdersCount(pendingCount + receivedCount);
        })
        .catch((error) => {
          console.error('Error loading pending orders:', error);
        });
    };

    socket.on('new_order', handleNewOrder); // This event is emitted for both new orders and order updates

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('conversation_update', handleNewOrder);
    };
  }, [socket]);

  const menuSections: MenuSection[] = [
    {
      title: 'WhatsApp',
      items: [
        { icon: MessageSquare, label: 'Chats', path: '/dashboard', showBadge: true },
        { icon: Contact, label: 'Contactos', path: '/dashboard/contacts' },
        { icon: Zap, label: 'Respuestas Rápidas', path: '/dashboard/quick-replies' },
      ],
    },
    {
      title: 'POS System',
      items: [
        { icon: FolderTree, label: 'Categorías', path: '/dashboard/categories' },
        { icon: Package, label: 'Productos', path: '/dashboard/products' },
        { icon: Warehouse, label: 'Inventario', path: '/dashboard/inventory' },
        { icon: ShoppingCart, label: 'Pedidos', path: '/dashboard/orders' },
      ],
    },
    {
      title: 'Sucursales',
      items: [
        { icon: MapPin, label: 'Sucursales', path: '/dashboard/branches' },
      ],
    },
    {
      title: 'Agentes',
      items: [
        { icon: Users, label: 'Agentes', path: '/dashboard/agents' },
      ],
    },
    {
      title: 'Analíticas',
      items: [
        { icon: BarChart3, label: 'Analíticas', path: '/dashboard/analytics' },
      ],
    },
  ];

  useEffect(() => {
    menuSections.forEach((section) => {
      const hasActiveItem = section.items.some((item) => item.path === pathname);
      if (hasActiveItem) {
        setExpandedSections((prev) => ({ ...prev, [section.title]: true }));
      }
    });
  }, [pathname]);

  const handleLogout = () => {
    setAgent(null);
    setToken(null);
    disconnectSocket();
    router.push('/login');
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const configItems: MenuItem[] = [
    { icon: Smartphone, label: 'WhatsApp', path: '/dashboard/whatsapp' },
    { icon: Settings, label: 'Configuración Bot', path: '/dashboard/bot-settings' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/dashboard/payment-methods' },
  ];

  const renderMenuItem = (item: MenuItem, badgeCount?: number) => {
    const Icon = item.icon;
    const isActive = pathname === item.path;
    const unreadCount = item.showBadge ? totalUnread : 0;
    const displayBadge = badgeCount !== undefined ? badgeCount : unreadCount;

    // Debug log for orders badge
    if (item.path === '/dashboard/orders') {
      console.log('Rendering Pedidos item with badge count:', displayBadge, 'pendingOrdersCount:', pendingOrdersCount);
    }

    return (
      <button
        key={item.path}
        onClick={() => router.push(item.path)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors relative',
          isActive
            ? 'bg-primary text-white'
            : 'text-text-secondary hover:bg-background hover:text-text-primary'
        )}
      >
        <Icon size={20} />
        <span className="flex-1 text-left">{item.label}</span>
        {displayBadge > 0 && (
          <span className={cn(
            "bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center",
            isActive && "bg-white text-primary"
          )}>
            {displayBadge > 99 ? '99+' : displayBadge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 bg-panel border-r border-border h-screen flex flex-col transition-transform duration-300 ease-in-out",
        "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 lg:p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">WhatsApp CRM</h2>
            {agent && (
              <p className="text-sm text-text-secondary mt-1">{agent.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-background rounded-md transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={24} />
          </button>
        </div>
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        {menuSections.map((section, sectionIndex) => {
          const isExpanded = expandedSections[section.title] ?? false;
          const hasActiveItem = section.items.some((item) => item.path === pathname);

          return (
            <div key={sectionIndex} className="space-y-2">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition-colors rounded-md hover:bg-background/50"
              >
                <span>{section.title}</span>
                {isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
              {isExpanded && (
                <div className="space-y-1 pl-2">
                  {section.items.map((item) => {
                    // Special handling for Pedidos item
                    if (item.path === '/dashboard/orders') {
                      return renderMenuItem(item, pendingOrdersCount);
                    }
                    return renderMenuItem(item);
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Configuración */}
        <div className="space-y-2 pt-2 border-t border-border">
          {configItems.map((item) => renderMenuItem(item))}
        </div>
      </nav>
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
        >
          <LogOut size={20} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

