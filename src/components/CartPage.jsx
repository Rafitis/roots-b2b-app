// src/components/CartPage.jsx
import { useState, useEffect, lazy, Suspense } from "react";
import { Trash2, AlertCircle, Plus } from "lucide-react";
import ClientForm from "./ClientForm";
import ItemsTable from "./ItemsTable";
import SummaryCheckout from "@components/SummaryCheckout";

// Lazy load: @react-pdf/renderer es ~500KB, solo cargarlo cuando se necesite
const InvoiceDownload = lazy(() => import("@components/invoice/InvoiceDownload"));
import {updateCartQuantity, updateCartDiscount, removeFromCart, removeAllFromCart, addToCartMultiple, useCartItems, useCartTotals } from "@hooks/useCart"
import { useTranslations } from "@i18n/utils";
import { useI18n } from "@hooks/useI18n";
import toast from 'react-hot-toast'

const CartPage = ({ DNI, IBAN}) => {
  const { currentLang } = useI18n();
  const t = useTranslations(currentLang);

  // Estado para modo edición (cargado desde localStorage si es que estamos editando)
  const [isEditingMode, setIsEditingMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('editingInvoice');
    }
    return false;
  });

  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('editingInvoiceNumber');
      return saved || null;
    }
    return null;
  });

  const [editingInvoiceId, setEditingInvoiceId] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('editingInvoiceId');
      return saved || null;
    }
    return null;
  });

  const [customerInfo, setCustomerInfo] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('editingCustomerInfo');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing saved customer info:', e);
        }
      }
    }
    return {
      fiscal_name: "",
      nif_cif: "",
      address: "",
      country: "",
      isRecharge: false,
      shopify_order_number: "",
    };
  });

  const cartItems = useCartItems();

  // Persistir cambios en customerInfo en localStorage mientras se está editando
  useEffect(() => {
    if (isEditingMode && customerInfo.fiscal_name) {
      localStorage.setItem('editingCustomerInfo', JSON.stringify(customerInfo));
    }
  }, [customerInfo, isEditingMode]);

  // Detectar si estamos en modo edición al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const editingData = localStorage.getItem('editingInvoice');
      const editingDataLoaded = localStorage.getItem('editingInvoiceLoaded');

      if (editingData && !editingDataLoaded) {
        try {
          const parsed = JSON.parse(editingData);

          localStorage.setItem('editingInvoiceLoaded', 'true');
          removeAllFromCart();

          if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
            addToCartMultiple(parsed.items);
          }

          const loadedCountry = parsed.customer_info.country;

          setCustomerInfo({
            fiscal_name: parsed.customer_info.fiscal_name,
            nif_cif: parsed.customer_info.nif_cif,
            address: parsed.customer_info.address,
            country: loadedCountry,
            isRecharge: parsed.customer_info.isRecharge || false,
            shopify_order_number: parsed.customer_info.shopify_order_number || ""
          });

          setIsEditingMode(true);
          setEditingInvoiceNumber(parsed.original_invoice_number);
          setEditingInvoiceId(parsed.original_invoice_id);

          localStorage.setItem('editingInvoiceNumber', parsed.original_invoice_number);
          localStorage.setItem('editingInvoiceId', parsed.original_invoice_id);

        } catch (error) {
          console.error('Error loading editing invoice data:', error);
          toast.error('Error al cargar datos de edición');
        }
      }
    }
  }, []);

  const handleUpdateQuantity = (e, item) => {
    const newQuantity = Number(e.target.value)
    updateCartQuantity(item, newQuantity)
    updateCartDiscount(item.tag, item.product_id)
  }

  const handleDeleteItem = (item) => {
    removeFromCart(item);
  };

  const handleDeleteAll = () => {
    removeAllFromCart();
  };

  const handleCreateNewOrder = () => {
    if (window.confirm('¿Deseas crear un nuevo pedido? Se borrará toda la información de la edición actual.')) {
      localStorage.removeItem('editingInvoice');
      localStorage.removeItem('editingInvoiceLoaded');
      localStorage.removeItem('editingCustomerInfo');
      localStorage.removeItem('editingInvoiceNumber');
      localStorage.removeItem('editingInvoiceId');

      removeAllFromCart();

      setIsEditingMode(false);
      setEditingInvoiceNumber(null);
      setEditingInvoiceId(null);
      setCustomerInfo({
        fiscal_name: "",
        nif_cif: "",
        address: "",
        country: "",
        isRecharge: false,
        shopify_order_number: "",
      });

      toast.success('Nuevo pedido creado. Carrito vacío.');
    }
  };

  const totals = useCartTotals(customerInfo, true);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Banner de modo edición */}
      {isEditingMode && (
        <div className="flex items-center justify-between gap-4 p-4 bg-info/5 border border-info/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-roots-bark">
                Editando factura <strong>#{editingInvoiceNumber}</strong>
              </p>
              <p className="text-xs text-roots-earth mt-0.5">
                Se creará una nueva factura. La original será marcada como cancelada.
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateNewOrder}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-warning text-warning-content rounded-md hover:opacity-90 transition-opacity flex-shrink-0"
            title="Crear un nuevo pedido y salir del modo edición"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Pedido
          </button>
        </div>
      )}

      {/* Datos del cliente */}
      <section>
        <h2 className="section-heading mb-4">{t('cart.infoTitle')}</h2>
        <ClientForm onStateChange={setCustomerInfo} initialData={customerInfo} />
      </section>

      {/* Tabla de items */}
      <section>
        <h2 className="section-heading mb-4">{t('table.title')}</h2>
        <ItemsTable items={cartItems} onDelete={handleDeleteItem} onUpdateQuantity={handleUpdateQuantity} />
      </section>

      {/* Resumen + acciones */}
      <SummaryCheckout customerInfo={customerInfo} />

      <div className="flex items-center justify-between gap-4 pb-8">
        <Suspense fallback={
          <button className="btn btn-primary btn-disabled" disabled>
            <span className="loading loading-spinner loading-sm"></span>
            Cargando...
          </button>
        }>
          <InvoiceDownload
            items={cartItems}
            customerInfo={customerInfo}
            dni={DNI}
            iban={IBAN}
            totals={totals}
            isEditingMode={isEditingMode}
            editingInvoiceId={editingInvoiceId}
          />
        </Suspense>
        <button
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-error border border-error/20 rounded-md hover:bg-error/5 transition-colors"
          onClick={handleDeleteAll}
        >
          <Trash2 className="w-4 h-4" />
          {t('global.delete')}
        </button>
      </div>
    </div>
  );
};

export default CartPage;
