// src/components/CustomerForm.jsx
import React, { useEffect, useState } from "react";

const CustomerForm = ({ onStateChange }) => {
  const [formData, setFormData] = useState({
    fiscal_name: "",
    nif_cif: "",
    address: "",
    isRecharge: false,
  });

  // Cada vez que el formulario cambie, se notifica al padre.
  useEffect(() => {
    onStateChange(formData);
  }, [formData, onStateChange]);

  return (
    <div className="flex flex-col gap-4 p-4 border rounded">
      <input
        type="text"
        placeholder="Nombre Fiscal"
        className="input input-bordered"
        value={formData.fiscal_name}
        onChange={(e) =>
          setFormData({ ...formData, fiscal_name: e.target.value })
        }
      />
      <input
        type="text"
        placeholder="NIF o CIF"
        className="input input-bordered"
        value={formData.nif_cif}
        onChange={(e) =>
          setFormData({ ...formData, nif_cif: e.target.value })
        }
      />
      <input
        type="text"
        placeholder="Dirección"
        className="input input-bordered"
        value={formData.address}
        onChange={(e) =>
          setFormData({ ...formData, address: e.target.value })
        }
      />
      <label className="flex items-center gap-2">
        <span>Recargo Equivalencia</span>
        <input
          type="checkbox"
          className="checkbox"
          checked={formData.isRecharge}
          onChange={(e) =>
            setFormData({ ...formData, isRecharge: e.target.checked })
          }
        />
      </label>
    </div>
  );
};

export default CustomerForm;

