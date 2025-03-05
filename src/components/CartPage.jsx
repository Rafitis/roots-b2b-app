// src/components/CartPage.jsx
import React, { useState } from "react";
import ClientForm from "./ClientForm";
import ItemsTable from "./ItemsTable";
import InvoiceDownload from "@components/invoice/InvoiceDownload";
import {removeFromCart, removeAllFromCart, getCart } from "@hooks/useCart"

const CartPage = ({ DNI, IBAN}) => {
  const [customerInfo, setCustomerInfo] = useState({
    fiscal_name: "",
    nif_cif: "",
    address: "",
    isRecharge: false,
  });
  const [cartItems, setCartItems] = useState(getCart());

  // Función para eliminar un item del carrito
  const handleDeleteItem = (item) => {
    const newCart = removeFromCart(item);
    setCartItems(newCart);
  };

  const handleDeleteAll = () => {
    const newCart = removeAllFromCart();
    setListCart(newCart);
  };

  // Calcula el total
  const total = cartItems.reduce(
    (acc, item) => acc + Number(item.price) * Number(item.quantity),
    0
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Información del Cliente</h2>
      <ClientForm onStateChange={setCustomerInfo} />
      <h2 className="text-xl font-bold my-4">Carrito de Compras</h2>
      <ItemsTable items={cartItems} onDelete={handleDeleteItem} />
      <div className="flex justify-between">
        <InvoiceDownload
          items={cartItems}
          total={total}
          customerInfo={customerInfo}
          dni={DNI}
          iban={IBAN}
          />
        <button className="btn btn-error btn-md" onClick={handleDeleteAll}>
          Eliminar todo
        </button>
      </div>
    </div>
  );
};

export default CartPage;
