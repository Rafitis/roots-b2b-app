// src/components/CartAndCustomer.jsx
import React, { useState, useCallback } from "react";
import CustomerDropdown from "./CustomerDropdown";
import CartTable from "./CartTable";

const CartAndCustomer = ({ DNI, IBAN }) => {
  const [shopData, setShopData] = useState({
    fiscal_name: "",
    nif_cif: "",
    address: "",
    isRecharge: false,
  });

  // Memoriza la función para evitar que cambie en cada render.
  const handleSelectCustomer = useCallback((newData) => {
    setShopData((prevData) => ({ ...prevData, ...newData }));
  }, []);

  return (
    <div>
      <CustomerDropdown onStateChange={handleSelectCustomer} />
      <CartTable DNI={DNI} IBAN={IBAN} selectedCustomer={shopData} />
    </div>
  );
};

export default CartAndCustomer;
