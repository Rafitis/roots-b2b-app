import React, { useEffect, useState } from "react";

const CustomerDropdown = ({ onStateChange }) => {
  const [name, setName] = useState("");
  const [nif, setNif] = useState("");
  const [address, setAddress] = useState("");
  const [isRecharge, setIsRecharge] = useState(false);

  // Cada vez que alguno de estos estados cambie, notificamos al padre.
  useEffect(() => {
    onStateChange({
      fiscal_name: name,
      nif_cif: nif,
      address: address,
      isRecharge: isRecharge,
    });
  }, [name, nif, address, isRecharge, onStateChange]);

  return (
    <div className="flex flex-row gap-2">
      <input type="text" placeholder="Nombre Fiscal" className="input input-bordered w-full max-w-xs" onChange={(e) => setName(e.target.value)} />
      <input type="text" placeholder="NIF o CIF" className="input input-bordered w-full max-w-xs" onChange={(e) => setNif(e.target.value)} />
      <input type="text" placeholder="Dirección" className="input input-bordered w-full max-w-xs" onChange={(e) => setAddress(e.target.value)} />
      <div className="form-control">
        <label className="label cursor-pointer gap-2">
          <span className="label-text">Recargo Equivalencia</span>
          <input type="checkbox" className="checkbox" onClick={() => setIsRecharge(!isRecharge)} />
        </label>
      </div>
    </div>
  );
};

export default CustomerDropdown;