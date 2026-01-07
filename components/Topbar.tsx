'use client';

import { Search, Filter } from 'lucide-react';
import { useState } from 'react';

interface TopbarProps {
  onSearch?: (query: string) => void;
  onFilter?: (filters: { tag?: string; mode?: string }) => void;
}

export function Topbar({ onSearch, onFilter }: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{ tag?: string; mode?: string }>({});

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  return (
    <div className="h-16 bg-panel border-b border-border px-6 flex items-center gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
        <input
          type="text"
          placeholder="Buscar conversaciones..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="relative">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-background border border-border rounded-md hover:bg-background/80 flex items-center gap-2"
        >
          <Filter size={20} />
          <span>Filtros</span>
        </button>
        {showFilters && (
          <div className="absolute right-0 top-full mt-2 bg-panel border border-border rounded-md p-4 w-64 z-10">
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Etiqueta</label>
                <select
                  value={filters.tag || ''}
                  onChange={(e) => handleFilterChange('tag', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                >
                  <option value="">Todas</option>
                  <option value="ventas">Ventas</option>
                  <option value="soporte">Soporte</option>
                  <option value="facturacion">Facturación</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Modo</label>
                <select
                  value={filters.mode || ''}
                  onChange={(e) => handleFilterChange('mode', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                >
                  <option value="">Todos</option>
                  <option value="BOT">Bot</option>
                  <option value="HUMAN">Humano</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

