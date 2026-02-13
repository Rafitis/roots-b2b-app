import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Barra de filtros para productos
 */
export default function ProductFilters({ 
  filters, 
  onFiltersChange, 
  availableTags,
  totalProducts,
  filteredCount
}) {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce de búsqueda (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange(prev => ({ ...prev, search: searchInput }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleTagChange = (e) => {
    onFiltersChange(prev => ({ ...prev, tag: e.target.value }));
  };

  const handleVisibilityChange = (e) => {
    onFiltersChange(prev => ({ ...prev, visibility: e.target.value }));
  };

  const handleClearFilters = () => {
    setSearchInput('');
    onFiltersChange({
      search: '',
      tag: '',
      visibility: 'all'
    });
  };

  const hasActiveFilters = filters.search || filters.tag || filters.visibility !== 'all';

  const inputClasses = "w-full px-3 py-2 text-sm bg-base-100 border border-base-300 rounded-md text-roots-bark placeholder-roots-clay/50 focus:outline-none focus:border-roots-clay transition-colors";

  return (
    <div className="card-b2b p-5 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-roots-earth uppercase tracking-wider">
            Buscar por nombre
          </label>
          <input
            type="text"
            placeholder="Escribe para buscar..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={inputClasses}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-roots-earth uppercase tracking-wider">
            Tag
          </label>
          <select
            value={filters.tag}
            onChange={handleTagChange}
            className={inputClasses + " cursor-pointer"}
          >
            <option value="">Todos los tags</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-roots-earth uppercase tracking-wider">
            Visibilidad
          </label>
          <select
            value={filters.visibility}
            onChange={handleVisibilityChange}
            className={inputClasses + " cursor-pointer"}
          >
            <option value="all">Todos</option>
            <option value="visible">Solo visibles</option>
            <option value="hidden">Solo ocultos</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className={[
              'w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              hasActiveFilters
                ? 'btn btn-primary btn-sm h-auto'
                : 'bg-base-200 text-roots-clay/50 border border-base-300 cursor-not-allowed'
            ].join(' ')}
          >
            <X className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-base-300/40 flex items-center justify-between">
        <div className="text-xs text-roots-earth">
          Mostrando <span className="font-semibold text-roots-bark">{filteredCount}</span> de{' '}
          <span className="font-semibold text-roots-bark">{totalProducts}</span> productos
          {hasActiveFilters && (
            <span className="ml-2 px-1.5 py-0.5 bg-warning/10 text-warning text-[10px] font-semibold rounded">
              FILTRADO
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
