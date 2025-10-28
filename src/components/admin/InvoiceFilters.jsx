/**
 * InvoiceFilters - Panel de filtros de búsqueda
 *
 * Permite filtrar por:
 * - Rango de fechas
 * - NIF/CIF
 * - Nombre de empresa
 * - Estado
 */

import React, { useState } from 'react';

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

  const hasActiveFilters = Object.values(localFilters).some(v => v !== '');

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Filtros de búsqueda</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Fecha desde */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Desde (Fecha)
          </label>
          <input
            type="date"
            value={localFilters.date_from}
            onChange={(e) => handleInputChange('date_from', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hasta (Fecha)
          </label>
          <input
            type="date"
            value={localFilters.date_to}
            onChange={(e) => handleInputChange('date_to', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* NIF/CIF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            NIF/CIF
          </label>
          <input
            type="text"
            placeholder="Ej: 12345678A"
            value={localFilters.nif}
            onChange={(e) => handleInputChange('nif', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Nombre de empresa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de Empresa
          </label>
          <input
            type="text"
            placeholder="Ej: Acme Corp"
            value={localFilters.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={localFilters.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Todos</option>
            <option value="draft">Borrador</option>
            <option value="finalized">Finalizada</option>
            <option value="rehashed">Rehecha</option>
          </select>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleApply}
          disabled={disabled}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
        >
          🔎 Buscar
        </button>
        <button
          onClick={handleClear}
          disabled={disabled || !hasActiveFilters}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition font-medium"
        >
          ✕ Limpiar
        </button>
      </div>

      {/* Resumen de filtros activos */}
      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Filtros activos:</strong> {
              [
                localFilters.date_from && `Desde ${localFilters.date_from}`,
                localFilters.date_to && `hasta ${localFilters.date_to}`,
                localFilters.nif && `NIF: ${localFilters.nif}`,
                localFilters.company && `Empresa: ${localFilters.company}`,
                localFilters.status && `Estado: ${localFilters.status}`
              ].filter(Boolean).join(' | ')
            }
          </p>
        </div>
      )}
    </div>
  );
}
