import React, { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw, RefreshCw, Check, X } from 'lucide-react';

/**
 * Tabla de productos con edición inline
 */
export default function ProductTable({ products, onUpdateProduct, onResetProduct, onSyncProduct }) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [savingProduct, setSavingProduct] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const toggleExpand = (productId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const startEdit = (product, field) => {
    setEditingCell({ productId: product.shopify_product_id, field });
    if (field === 'display_name') {
      setEditValue(product.display_name || '');
    } else if (field === 'price_override') {
      setEditValue(product.price_override || '');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async (product) => {
    if (!editingCell) return;

    const { field } = editingCell;
    let value = editValue.trim();

    if (field === 'price_override') {
      if (value === '') {
        value = null;
      } else {
        const price = parseFloat(value);
        if (isNaN(price) || price < 0) {
          alert('El precio debe ser un número positivo');
          return;
        }
        value = price;
      }
    }

    if (field === 'display_name' && value === '') {
      value = null;
    }

    setSavingProduct(product.shopify_product_id);
    const result = await onUpdateProduct(product.shopify_product_id, {
      [field]: value
    });
    setSavingProduct(null);

    if (result.success) {
      setEditingCell(null);
      setEditValue('');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleToggleVisibility = async (product) => {
    setSavingProduct(product.shopify_product_id);
    const result = await onUpdateProduct(product.shopify_product_id, {
      is_visible: !product.is_visible
    });
    setSavingProduct(null);

    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  const handleReset = async (product) => {
    setSavingProduct(product.shopify_product_id);
    const result = await onResetProduct(product.shopify_product_id);
    setSavingProduct(null);

    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  const handleSyncProduct = async (product) => {
    setSavingProduct(product.shopify_product_id);
    await onSyncProduct(product.shopify_product_id);
    setSavingProduct(null);
  };

  const getStockClasses = (stock) => {
    if (stock === 0) return { text: 'text-error font-bold', bg: 'bg-error/5' };
    if (stock < 10) return { text: 'text-warning font-bold', bg: 'bg-warning/5' };
    return { text: 'text-success font-bold', bg: 'bg-success/5' };
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedProducts = () => {
    if (!sortConfig.key) return products;

    const sorted = [...products].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'name':
          aValue = (a.display_name || a.shopify_name).toLowerCase();
          bValue = (b.display_name || b.shopify_name).toLowerCase();
          break;
        case 'price':
          aValue = parseFloat(a.price_override || a.shopify_price || 0);
          bValue = parseFloat(b.price_override || b.shopify_price || 0);
          break;
        case 'stock':
          aValue = a.total_stock;
          bValue = b.total_stock;
          break;
        case 'visible':
          aValue = a.is_visible ? 1 : 0;
          bValue = b.is_visible ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-roots-clay/40 ml-1 text-[10px]">↕</span>;
    }
    return (
      <span className="text-roots-bark ml-1 text-[10px] font-bold">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  if (products.length === 0) {
    return (
      <div className="card-b2b p-12 text-center">
        <div className="text-sm text-roots-clay">
          No hay productos que coincidan con los filtros
        </div>
      </div>
    );
  }

  const thBase = "py-3 px-4 text-xs font-medium text-roots-earth uppercase tracking-wider";
  const thSortable = thBase + " cursor-pointer hover:bg-base-300/40 transition-colors select-none";

  return (
    <div className="card-b2b overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-base-200/60 sticky top-0 z-10">
            <tr>
              <th className={thBase + " w-10"}></th>
              <th className={thBase + " w-16"}>Imagen</th>
              <th className={thSortable + " text-left"} onClick={() => handleSort('name')}>
                <span className="flex items-center">Nombre<SortIndicator columnKey="name" /></span>
              </th>
              <th className={thBase + " text-left"}>Tags</th>
              <th className={thSortable + " text-right"} onClick={() => handleSort('price')}>
                <span className="flex items-center justify-end">Precio (IVA)<SortIndicator columnKey="price" /></span>
              </th>
              <th className={thBase + " text-right"}>Precio (Sin IVA)</th>
              <th className={thSortable + " text-center"} onClick={() => handleSort('stock')}>
                <span className="flex items-center justify-center">Stock<SortIndicator columnKey="stock" /></span>
              </th>
              <th className={thSortable + " text-center"} onClick={() => handleSort('visible')}>
                <span className="flex items-center justify-center">Visible<SortIndicator columnKey="visible" /></span>
              </th>
              <th className={thBase + " text-center"}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-300/40">
            {getSortedProducts().map(product => {
              const isExpanded = expandedRows.has(product.shopify_product_id);
              const isSaving = savingProduct === product.shopify_product_id;
              const isEditingName = editingCell?.productId === product.shopify_product_id && editingCell?.field === 'display_name';
              const isEditingPrice = editingCell?.productId === product.shopify_product_id && editingCell?.field === 'price_override';

              const displayPrice = product.price_override || product.shopify_price || 0;
              const priceNoVAT = (parseFloat(displayPrice) / 1.21).toFixed(2);
              const hasOverride = product.display_name || product.price_override;

              return (
                <React.Fragment key={product.shopify_product_id}>
                  <tr
                    className={[
                      'hover:bg-base-200/30 transition-colors',
                      isSaving ? 'opacity-50' : ''
                    ].join(' ')}
                  >
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleExpand(product.shopify_product_id)}
                        className="p-0.5 text-roots-clay hover:text-roots-bark transition-colors"
                        disabled={isSaving}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      {product.imagen && (
                        <img
                          src={product.imagen}
                          alt={product.shopify_name}
                          className="w-12 h-12 object-cover border border-base-300 rounded"
                        />
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {isEditingName ? (
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(product);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="flex-1 px-2.5 py-1 text-sm bg-base-100 border-2 border-roots-bark rounded font-medium text-roots-bark focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(product)}
                            className="p-1.5 bg-success text-success-content rounded hover:opacity-90 transition-opacity"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 text-roots-clay hover:bg-base-200 rounded transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEdit(product, 'display_name')}
                          className="cursor-pointer px-2 py-1 -mx-2 rounded border border-transparent hover:border-base-300 transition-all group"
                        >
                          <div className="font-medium text-roots-bark group-hover:text-roots-clay transition-colors">
                            {product.display_name || product.shopify_name}
                          </div>
                          {product.display_name && (
                            <div className="text-[11px] text-roots-clay/60 font-mono mt-0.5">
                              Original: {product.shopify_name}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(product.tags || []).map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-base-200 text-roots-earth text-[10px] font-medium rounded uppercase tracking-wider"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isEditingPrice ? (
                        <div className="flex gap-1.5 justify-end">
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(product);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="w-24 px-2.5 py-1 text-sm bg-base-100 border-2 border-roots-bark rounded font-bold text-roots-bark text-right focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(product)}
                            className="p-1.5 bg-success text-success-content rounded hover:opacity-90 transition-opacity"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 text-roots-clay hover:bg-base-200 rounded transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEdit(product, 'price_override')}
                          className="cursor-pointer px-2 py-1 -mx-2 rounded border border-transparent hover:border-base-300 transition-all group inline-block"
                        >
                          <div className="font-bold text-roots-bark tabular-nums group-hover:text-roots-clay transition-colors">
                            {parseFloat(displayPrice).toFixed(2)} €
                          </div>
                          {product.price_override && (
                            <div className="text-[11px] text-roots-clay/60 font-mono mt-0.5">
                              Orig: {parseFloat(product.shopify_price).toFixed(2)} €
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-xs text-roots-clay tabular-nums">
                      {priceNoVAT} €
                    </td>

                    <td className="py-3 px-4 text-center">
                      {(() => {
                        const s = getStockClasses(product.total_stock);
                        return (
                          <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded text-xs ${s.bg} ${s.text} tabular-nums`}>
                            {product.total_stock}
                          </span>
                        );
                      })()}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleVisibility(product)}
                        disabled={isSaving}
                        className={[
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                          product.is_visible ? 'bg-success' : 'bg-base-300'
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm',
                            product.is_visible ? 'translate-x-4' : 'translate-x-0.5'
                          ].join(' ')}
                        />
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleSyncProduct(product)}
                          disabled={isSaving}
                          className="p-1.5 text-roots-clay hover:text-primary hover:bg-primary/10 rounded transition-colors"
                          title="Sincronizar este producto"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                        </button>
                        {hasOverride && (
                          <button
                            onClick={() => handleReset(product)}
                            disabled={isSaving}
                            className="p-1.5 text-roots-clay hover:text-error hover:bg-error/10 rounded transition-colors"
                            title="Resetear a valores de Shopify"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${product.shopify_product_id}-variants`}>
                      <td colSpan="9" className="bg-base-200/30 p-5 border-b border-base-300/40">
                        <div className="text-xs font-medium text-roots-earth uppercase tracking-wider mb-3">Variantes y Stock:</div>
                        <div className="bg-base-100 border border-base-300/60 rounded overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-base-200/40">
                                <th className="py-2 px-4 text-left text-xs font-medium text-roots-earth uppercase tracking-wider">SKU</th>
                                <th className="py-2 px-4 text-left text-xs font-medium text-roots-earth uppercase tracking-wider">Talla</th>
                                <th className="py-2 px-4 text-left text-xs font-medium text-roots-earth uppercase tracking-wider">Color</th>
                                <th className="py-2 px-4 text-right text-xs font-medium text-roots-earth uppercase tracking-wider">Stock</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-base-300/30">
                              {(product.product_variants || []).map(variant => {
                                const vs = getStockClasses(variant.stock_actual);
                                return (
                                  <tr key={variant.id}>
                                    <td className="py-2 px-4 font-mono text-xs text-roots-clay">{variant.sku}</td>
                                    <td className="py-2 px-4 text-roots-bark">{variant.talla}</td>
                                    <td className="py-2 px-4 text-roots-bark">{variant.color}</td>
                                    <td className="py-2 px-4 text-right">
                                      <span className={`inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded text-xs ${vs.bg} ${vs.text} tabular-nums`}>
                                        {variant.stock_actual}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
