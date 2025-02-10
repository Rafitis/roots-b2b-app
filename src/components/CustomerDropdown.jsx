import React, { useEffect, useState } from "react";

const CustomerDropdown = ({ onSelect }) => {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    // Realiza la consulta a la API de clientes
    fetch("/api/customers/customers")
      .then((res) => res.json())
      .then((data) => {
        // Aseguramos que data es un array
        const list = Array.isArray(data) ? data : [];
        setCustomers(list);
        // Opcional: selecciona el primer cliente por defecto si existe alguno
        if (list.length > 0) {
          setSelected(list[0].id);
          onSelect && onSelect(list[0]);
        }
      })
      .catch((error) =>
        console.error("Error fetching customers in dropdown:", error)
      );
  }, []);

  const handleChange = (e) => {
    const selected = e.target.value;
    setSelected(selected)
    const customer = customers.find((customer) => customer.id.toString() === selected.toString());
    onSelect && onSelect(customer);
  };
  
  return (
    <select 
      name="customer" 
      value={selected}
      onChange={handleChange}
      className="select select-bordered w-full max-w-xs">
      <option disabled selected>Datos tienda</option>
      {customers.map((client) => (
        <option key={client.id} value={client.id}>
          {client.name}
        </option>
      ))}
    </select>
  );
};

export default CustomerDropdown;