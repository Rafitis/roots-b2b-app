// src/components/CustomerForm.jsx
import React, { useEffect, useState } from "react";
import { useTranslations } from '@i18n/utils';
import { useI18n } from "@hooks/useI18n";

const CustomerForm = ({ onStateChange }) => {
  const { currentLang } = useI18n();
  const t = useTranslations(currentLang);

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
    <div className="w-full flex flex-col justify-center gap-4 p-4 border rounded">
      <input
        type="text"
        placeholder={t('cart.namePlaceholder')}
        className="input input-bordered"
        value={formData.fiscal_name}
        onChange={(e) =>
          setFormData({ ...formData, fiscal_name: e.target.value })
        }
      />
      <input
        type="text"
        placeholder={t('cart.nifPlaceholder')}
        className="input input-bordered"
        value={formData.nif_cif}
        onChange={(e) =>
          setFormData({ ...formData, nif_cif: e.target.value })
        }
      />
      <input
        type="text"
        placeholder={t('cart.addressPlaceholder')}
        className="input input-bordered"
        value={formData.address}
        onChange={(e) =>
          setFormData({ ...formData, address: e.target.value })
        }
      />
      <label className="flex items-center gap-2">
        <span>{t('cart.tax')}</span>
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

