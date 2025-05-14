// src/components/CartPage.jsx
import React, { useState } from "react";
import ClientForm from "./ClientForm";
import ItemsTable from "./ItemsTable";
import InvoiceDownload from "@components/invoice/InvoiceDownload";
import SummaryCheckout from "@components/SummaryCheckout";
import {updateCartQuantity, updateCartDiscount, removeFromCart, removeAllFromCart, getCart } from "@hooks/useCart"
import { useTranslations } from "@i18n/utils";
import { useI18n } from "@hooks/useI18n";

const CartPage = ({ DNI, IBAN}) => {
  const { currentLang } = useI18n();
  const t = useTranslations(currentLang);

  const [customerInfo, setCustomerInfo] = useState({
    fiscal_name: "",
    nif_cif: "",
    address: "",
    country: "",
    isRecharge: false,
  });
  const [cartItems, setCartItems] = useState(getCart());

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

  return (
    <div>
      <h2 className="text-xl font-bold py-10">{t('cart.infoTitle')}</h2>
      <ClientForm onStateChange={setCustomerInfo} />
      <h2 className="text-xl font-bold py-10">{t('table.title')}</h2>
      <ItemsTable items={cartItems} onDelete={handleDeleteItem} onUpdateQuantity={handleUpdateQuantity} />
      <SummaryCheckout customerInfo={customerInfo} />
      <div className="flex justify-between">
        <InvoiceDownload
          items={cartItems}
          customerInfo={customerInfo}
          dni={DNI}
          iban={IBAN}
          />
        <button className="btn btn-error btn-md hover:scale-105 text-primary" onClick={handleDeleteAll}>
          {t('global.delete')}
        </button>
      </div>
    </div>
  );
};

export default CartPage;
