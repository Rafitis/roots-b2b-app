import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ProductFilters from './ProductFilters.jsx';
import ProductTable from './ProductTable.jsx';

/**
 * Panel de administración de productos
 * 
 * Permite gestionar el catálogo B2B:
 * - Listar productos con variantes y stock
 * - Editar nombre personalizado y precio override
 * - Toggle de visibilidad
 * - Filtrar por nombre, tag, visibilidad
 */
export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    tag: '',
    visibility: 'all' // all | visible | hidden
  });
  const [syncing, setSyncing] = useState(false);

  // Fetch productos al montar
  useEffect(() => {
    fetchProducts();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [filters, products]);

  const fetchProducts = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/products');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar productos');
      }

      setProducts(data.products);
      setFilteredProducts(data.products);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSyncShopify = async () => {
    if (syncing) return;

    setSyncing(true);
    const toastId = toast.loading('Sincronizando Shopify...');

    try {
      const response = await fetch('/api/admin/sync-shopify', { method: 'POST' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al sincronizar');
      }

      toast.success(
        `Sync completado: ${data.products_synced} productos, ${data.variants_synced} variantes`,
        { id: toastId }
      );

      await fetchProducts({ silent: true });
    } catch (err) {
      console.error('Error syncing Shopify:', err);
      toast.error(err.message || 'Error al sincronizar Shopify', { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Filtro por búsqueda (nombre)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        (p.display_name || p.shopify_name).toLowerCase().includes(searchLower)
      );
    }

    // Filtro por tag
    if (filters.tag) {
      filtered = filtered.filter(p => 
        p.tags && p.tags.includes(filters.tag)
      );
    }

    // Filtro por visibilidad
    if (filters.visibility === 'visible') {
      filtered = filtered.filter(p => p.is_visible === true);
    } else if (filters.visibility === 'hidden') {
      filtered = filtered.filter(p => p.is_visible === false);
    }

    setFilteredProducts(filtered);
  };

  const getLastSync = () => {
    if (!products.length) return null;
    const timestamps = products
      .map(p => p.last_synced_at)
      .filter(Boolean)
      .map(ts => new Date(ts).getTime())
      .filter(ms => !Number.isNaN(ms));

    if (!timestamps.length) return null;
    return new Date(Math.max(...timestamps));
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Sin datos';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Hace menos de 1 min';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  };

  const handleUpdateProduct = async (shopify_product_id, updates) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopify_product_id,
          ...updates
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al actualizar producto');
      }

      // Actualizar producto en el estado local
      setProducts(prev => prev.map(p => 
        p.shopify_product_id === shopify_product_id
          ? { ...p, ...data.product }
          : p
      ));

      return { success: true };
    } catch (err) {
      console.error('Error updating product:', err);
      return { success: false, error: err.message };
    }
  };

  const handleSyncProduct = async (shopify_product_id) => {
    const toastId = toast.loading('Sincronizando producto...');

    try {
      const response = await fetch('/api/admin/sync-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopify_product_id })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al sincronizar producto');
      }

      toast.success(
        `${data.product_name}: ${data.variants_synced} variantes sincronizadas`,
        { id: toastId }
      );

      await fetchProducts({ silent: true });
      return { success: true };
    } catch (err) {
      console.error('Error syncing product:', err);
      toast.error(err.message, { id: toastId });
      return { success: false, error: err.message };
    }
  };

  const handleResetProduct = async (shopify_product_id) => {
    if (!confirm('¿Resetear este producto a valores por defecto de Shopify?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/products?shopify_product_id=${shopify_product_id}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al resetear producto');
      }

      // Actualizar producto en el estado local
      setProducts(prev => prev.map(p => 
        p.shopify_product_id === shopify_product_id
          ? { ...p, ...data.product }
          : p
      ));

      return { success: true };
    } catch (err) {
      console.error('Error resetting product:', err);
      return { success: false, error: err.message };
    }
  };

  // Extraer tags únicos para el filtro
  const availableTags = [...new Set(
    products.flatMap(p => p.tags || [])
  )].sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-roots-clay"></span>
          <div className="text-roots-earth font-medium tracking-wide">Cargando inventario...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="card-b2b border-error/30 p-6">
          <div className="flex items-start gap-4">
            <div className="text-error text-2xl font-bold">!</div>
            <div className="flex-1">
              <div className="font-bold text-roots-bark mb-2">Error al cargar inventario</div>
              <div className="text-roots-clay mb-4">{error}</div>
              <button 
                onClick={fetchProducts}
                className="btn btn-primary btn-sm"
              >
                Reintentar carga
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-base-300/60 pb-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-roots-bark tracking-tight mb-1">
                Inventario B2B
              </h1>
              <p className="text-sm text-roots-earth">
                Gestión de catálogo · Precios · Stock · Visibilidad
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-roots-clay font-medium tabular-nums">
                {products.length} productos
              </div>
              <div className="flex flex-col items-end">
                <button
                  onClick={handleSyncShopify}
                  disabled={syncing}
                  className="btn btn-primary btn-sm"
                  title="Sincronizar con Shopify"
                >
                  {syncing ? (
                    <><span className="loading loading-spinner loading-xs"></span> Sincronizando...</>
                  ) : (
                    <>Sync Shopify</>
                  )}
                </button>
                <span
                  className="mt-1 text-[11px] text-roots-clay tabular-nums"
                  title={getLastSync() ? getLastSync().toLocaleString('es-ES') : ''}
                >
                  Ultima sync: {formatTimeAgo(getLastSync())}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <ProductFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableTags={availableTags}
          totalProducts={products.length}
          filteredCount={filteredProducts.length}
        />

        {/* Tabla de productos */}
        <ProductTable
          products={filteredProducts}
          onUpdateProduct={handleUpdateProduct}
          onResetProduct={handleResetProduct}
          onSyncProduct={handleSyncProduct}
        />
      </div>
    </div>
  );
}
