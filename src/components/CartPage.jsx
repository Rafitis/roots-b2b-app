// src/components/CartPage.jsx
import { useState, useEffect, lazy, Suspense } from "react";
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
    // Intentar cargar desde localStorage si es que estamos editando
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
  // ✅ NUEVO: Usar hook reactivo sin delay (solución al bug de race condition)
  const cartItems = useCartItems();

  // Persistir cambios en customerInfo en localStorage mientras se está editando
  useEffect(() => {
    if (isEditingMode && customerInfo.fiscal_name) {
      localStorage.setItem('editingCustomerInfo', JSON.stringify(customerInfo));
    }
  }, [customerInfo, isEditingMode]);

  // Detectar si estamos en modo edición al montar (solo una vez por sesión)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const editingData = localStorage.getItem('editingInvoice');
      const editingDataLoaded = localStorage.getItem('editingInvoiceLoaded');

      // Solo cargar si: 1) hay datos de edición, Y 2) NO se han cargado aún en esta sesión
      if (editingData && !editingDataLoaded) {
        try {
          const parsed = JSON.parse(editingData);

          // Marcar que ya cargamos los datos en esta sesión
          localStorage.setItem('editingInvoiceLoaded', 'true');

          // Limpiar carrito actual
          removeAllFromCart();

          // Cargar items de la factura
          if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
            addToCartMultiple(parsed.items);
            // ✅ No necesitamos setCartItems - useCartItems() se actualiza automáticamente
          }

          // Cargar información del cliente (incluyendo shopify_order_number e isRecharge)
          const loadedCountry = parsed.customer_info.country;

          setCustomerInfo({
            fiscal_name: parsed.customer_info.fiscal_name,
            nif_cif: parsed.customer_info.nif_cif,
            address: parsed.customer_info.address,
            country: loadedCountry,
            isRecharge: parsed.customer_info.isRecharge || false,
            shopify_order_number: parsed.customer_info.shopify_order_number || ""
          });

          // Marcar como modo edición y guardar en localStorage para persistencia
          setIsEditingMode(true);
          setEditingInvoiceNumber(parsed.original_invoice_number);
          setEditingInvoiceId(parsed.original_invoice_id);

          localStorage.setItem('editingInvoiceNumber', parsed.original_invoice_number);
          localStorage.setItem('editingInvoiceId', parsed.original_invoice_id);

          // NO limpiar localStorage - lo mantenemos mientras se edita
          // Se borrará solo cuando se guarde la factura
        } catch (error) {
          console.error('❌ Error loading editing invoice data:', error);
          toast.error('Error al cargar datos de edición');
        }
      }
    }
  }, []);

  const handleUpdateQuantity = (e, item) => {
    const newQuantity = Number(e.target.value)
    updateCartQuantity(item, newQuantity)
    updateCartDiscount(item.tag, item.product_id)
    // ✅ No necesitamos setCartItems - useCartItems() se actualiza automáticamente
  }

  // Función para eliminar un item del carrito
  const handleDeleteItem = (item) => {
    removeFromCart(item);
    // ✅ No necesitamos setCartItems - useCartItems() se actualiza automáticamente
  };

  const handleDeleteAll = () => {
    removeAllFromCart();
    // ✅ No necesitamos setCartItems - useCartItems() se actualiza automáticamente
  };

  // Crear un nuevo pedido (salir del modo edición)
  const handleCreateNewOrder = () => {
    if (window.confirm('¿Deseas crear un nuevo pedido? Se borrará toda la información de la edición actual.')) {
      // Limpiar localStorage de edición
      localStorage.removeItem('editingInvoice');
      localStorage.removeItem('editingInvoiceLoaded');
      localStorage.removeItem('editingCustomerInfo');
      localStorage.removeItem('editingInvoiceNumber');
      localStorage.removeItem('editingInvoiceId');

      // Limpiar carrito
      removeAllFromCart();

      // Resetear estados
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
      // ✅ No necesitamos setCartItems - useCartItems() se actualiza automáticamente

      toast.success('Nuevo pedido creado. Carrito vacío.');
    }
  };

  // ✅ NUEVO: Calcular totales con hook reactivo y memoizado
  // Se actualiza automáticamente cuando cambia el carrito o customerInfo
  const totals = useCartTotals(customerInfo, true);

  return (
    <div>
      {/* Banner de modo edición */}
      {isEditingMode && (
        <div className="mb-6 p-4 bg-blue-100 border-l-4 border-blue-600 rounded">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 font-semibold">
                ✏️ Editando factura <strong>#{editingInvoiceNumber}</strong>
              </p>
              <p className="text-sm text-blue-700">
                Se creará una nueva factura. La original será marcada como cancelada.
              </p>
            </div>
            <button
              onClick={handleCreateNewOrder}
              className="px-4 py-2 bg-orange-500 text-white rounded text-sm font-medium hover:bg-orange-600 transition"
              title="Crear un nuevo pedido y salir del modo edición"
            >
              ➕ Nuevo Pedido
            </button>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold py-10">{t('cart.infoTitle')}</h2>
      <ClientForm onStateChange={setCustomerInfo} initialData={customerInfo} />
      <h2 className="text-xl font-bold py-10">{t('table.title')}</h2>
      <ItemsTable items={cartItems} onDelete={handleDeleteItem} onUpdateQuantity={handleUpdateQuantity} />
      <SummaryCheckout customerInfo={customerInfo} />
      <div className="flex justify-between">
        <Suspense fallback={<button className="btn btn-primary btn-disabled">Cargando...</button>}>
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
        <button className="btn btn-error btn-md hover:scale-105 text-primary" onClick={handleDeleteAll}>
          {t('global.delete')}
        </button>
      </div>
    </div>
  );
};

export default CartPage;
