import React, { useEffect, useState } from "react";


export default function ClientForm ({  }) {
  const [name, setName] = useState("");
  const [nif, setNif] = useState("");
  const [address, setAddress] = useState("");
  const [isRecharge, setIsRecharge] = useState(false);

  const Counter = ({ initialCount }) => {
    const [count, setCount] = useState(initialCount);
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-2">
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
}
