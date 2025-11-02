// src/components/CartPage.jsx
import React, { useState, useEffect } from "react";
import ClientForm from "./ClientForm";
import ItemsTable from "./ItemsTable";
import InvoiceDownload from "@components/invoice/InvoiceDownload";
import SummaryCheckout from "@components/SummaryCheckout";
import {updateCartQuantity, updateCartDiscount, removeFromCart, removeAllFromCart, getCart, calculateTotals, addToCartMultiple, itemsStore } from "@hooks/useCart"
import { useTranslations } from "@i18n/utils";
import { useI18n } from "@hooks/useI18n";
import toast, { Toaster } from 'react-hot-toast'

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
  const [cartItems, setCartItems] = useState(getCart());

  // Suscribirse a cambios en itemsStore (cuando se añaden/eliminan items desde otros componentes)
  useEffect(() => {
    const unsubscribe = itemsStore.subscribe((items) => {
      setCartItems(items);
    });
    return unsubscribe;
  }, []);

  // Persistir cambios en customerInfo en localStorage mientras se está editando
  useEffect(() => {
    if (isEditingMode && customerInfo.fiscal_name) {
      localStorage.setItem('editingCustomerInfo', JSON.stringify(customerInfo));
      console.log('💾 Customer info guardado en localStorage');
    }
  }, [customerInfo, isEditingMode]);

  // Detectar si estamos en modo edición al montar (solo una vez por sesión)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const editingData = localStorage.getItem('editingInvoice');
      const editingDataLoaded = localStorage.getItem('editingInvoiceLoaded');

      console.log('🔍 CartPage mount - editingData:', !!editingData, 'editingDataLoaded:', !!editingDataLoaded);

      // Solo cargar si: 1) hay datos de edición, Y 2) NO se han cargado aún en esta sesión
      if (editingData && !editingDataLoaded) {
        try {
          const parsed = JSON.parse(editingData);
          console.log('📦 Loading invoice for editing:', parsed.original_invoice_number);
          console.log('📊 Items count:', parsed.items?.length || 0);

          // Marcar que ya cargamos los datos en esta sesión
          localStorage.setItem('editingInvoiceLoaded', 'true');

          // Limpiar carrito actual
          removeAllFromCart();
          console.log('🗑️ Carrito limpiado');

          // Cargar items de la factura
          if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
            addToCartMultiple(parsed.items);
            console.log('✅ addToCartMultiple ejecutado con', parsed.items.length, 'items');

            // Dar un pequeño delay para que los items se persistan en localStorage
            setTimeout(() => {
              const cartNow = getCart();
              console.log('✅ Cart después del delay:', cartNow.length, 'items');
              setCartItems(cartNow);
            }, 50);
          }

          // Cargar información del cliente (incluyendo shopify_order_number e isRecharge)
          const loadedCountry = parsed.customer_info.country;
          console.log('🌍 País cargado de la factura:', loadedCountry);

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
    setCartItems(getCart())
  }

  // Función para eliminar un item del carrito
  const handleDeleteItem = (item) => {
    const newCart = removeFromCart(item);
    setCartItems(newCart);
  };

  const handleDeleteAll = () => {
    const newCart = removeAllFromCart();
    setCartItems(newCart);
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
      setCartItems([]);

      toast.success('Nuevo pedido creado. Carrito vacío.');
    }
  };

  // Calcular totales para pasar a InvoiceDownload
  const countryCode = customerInfo.country || 'ES';
  console.log('💰 Calculando totales con país:', countryCode, 'Recargo:', customerInfo.isRecharge);

  const { total_sin_iva, iva, total_recargo, total_factura } = calculateTotals({
    countryCode,
    isRecharge: customerInfo.isRecharge
  });

  console.log('📊 Totales calculados - Sin IVA:', total_sin_iva, 'IVA:', iva, 'Total:', total_factura);

  // Calcular envío basado en país y total
  const calculateShipping = () => {
    // Canarias siempre envío gratis
    if (countryCode === 'ES-CN' || countryCode === 'ES-CE' || countryCode === 'ES-ML') {
      console.log('🚚 Envío gratis (Canarias)');
      return 0;
    }

    // España: 5€ (gratis si > 200€)
    if (countryCode === 'ES') {
      const shipping = total_factura > 200 ? 0 : 5;
      console.log('🚚 Envío España:', shipping, '€ (Total sin envío:', total_factura, '€)');
      return shipping;
    }

    // Otros países: 15€ (gratis si > 400€)
    const shipping = total_factura > 400 ? 0 : 15;
    console.log('🚚 Envío Internacional:', shipping, '€ (Total sin envío:', total_factura, '€)');
    return shipping;
  };

  const shipping = calculateShipping();
  const total_con_envio = total_factura + shipping;

  const totals = {
    total_sin_iva,
    iva,
    recargo: total_recargo,
    shipping,
    total_factura: total_con_envio
  };

  return (
    <div>
      <Toaster position="bottom-center" reverseOrder={false} />

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
        <InvoiceDownload
          items={cartItems}
          customerInfo={customerInfo}
          dni={DNI}
          iban={IBAN}
          totals={totals}
          isEditingMode={isEditingMode}
          editingInvoiceId={editingInvoiceId}
          />
        <button className="btn btn-error btn-md hover:scale-105 text-primary" onClick={handleDeleteAll}>
          {t('global.delete')}
        </button>
      </div>
    </div>
  );
};

export default CartPage;
