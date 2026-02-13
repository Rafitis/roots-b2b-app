/**
 * InvoiceFilters - Panel de filtros de búsqueda
 */

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

export default function InvoiceFilters({ filters, onApply, onClear, disabled }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleInputChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleClear = () => {
    const clearedFilters = {
      date_from: '',
      date_to: '',
      nif: '',
      company: '',
      status: ''
    };
    setLocalFilters(clearedFilters);
    onClear();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleApply();
  };

  const hasActiveFilters = Object.values(localFilters).some(v => v !== '');

  const inputClasses = "w-full px-3 py-2 text-sm bg-base-100 border border-base-300 rounded-md focus:border-roots-clay focus:outline-none disabled:bg-base-200 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="card-b2b p-5">
      <h2 className="text-sm font-semibold text-roots-bark mb-4">Filtros de búsqueda</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-roots-earth">Desde (Fecha)</label>
          <input
            type="date"
            value={localFilters.date_from}
            onChange={(e) => handleInputChange('date_from', e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={inputClasses}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-roots-earth">Hasta (Fecha)</label>
          <input
            type="date"
            value={localFilters.date_to}
            onChange={(e) => handleInputChange('date_to', e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={inputClasses}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-roots-earth">NIF/CIF</label>
          <input
            type="text"
            placeholder="Ej: 12345678A"
            value={localFilters.nif}
            onChange={(e) => handleInputChange('nif', e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={inputClasses}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-roots-earth">Nombre de Empresa</label>
          <input
            type="text"
            placeholder="Ej: Acme Corp"
            value={localFilters.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={inputClasses}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-roots-earth">Estado</label>
          <select
            value={localFilters.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            disabled={disabled}
            className={inputClasses}
          >
            <option value="">Todos</option>
            <option value="draft">Borrador</option>
            <option value="finalized">Finalizada</option>
            <option value="rehashed">Rehecha</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={handleApply}
          disabled={disabled}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium btn btn-primary btn-sm"
        >
          <Search className="w-3.5 h-3.5" />
          Buscar
        </button>
        <button
          onClick={handleClear}
          disabled={disabled || !hasActiveFilters}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-roots-earth border border-base-300 rounded-md hover:bg-base-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Limpiar
        </button>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 px-3 py-2 bg-base-200/60 border border-base-300/40 rounded-md">
          <p className="text-xs text-roots-earth">
            <span className="font-medium">Filtros activos:</span>{' '}
            {[
              localFilters.date_from && `Desde ${localFilters.date_from}`,
              localFilters.date_to && `hasta ${localFilters.date_to}`,
              localFilters.nif && `NIF: ${localFilters.nif}`,
              localFilters.company && `Empresa: ${localFilters.company}`,
              localFilters.status && `Estado: ${localFilters.status}`
            ].filter(Boolean).join(' | ')}
          </p>
        </div>
      )}
    </div>
  );
}
