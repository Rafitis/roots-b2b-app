// src/components/CartAndCustomer.jsx
import React, { useState } from "react";
import CustomerDropdown from "./CustomerDropdown";
import CartTable from "./CartTable";

const CartAndCustomer = ({ DNI, IBAN }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
  };

  return (
    <div>
      <CustomerDropdown onSelect={handleSelectCustomer} />
      <CartTable
        DNI={DNI}
        IBAN={IBAN}
        selectedCustomer={selectedCustomer}
      />
    </div>
  );
};

export default CartAndCustomer;
