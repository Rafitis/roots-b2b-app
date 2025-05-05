// src/components/CustomerForm.jsx
import React, { useEffect, useState } from "react";
import { useTranslations } from '@i18n/utils';
import { useI18n } from "@hooks/useI18n";
import { countries } from "@i18n/ui";

const CustomerForm = ({ onStateChange }) => {
  const { currentLang } = useI18n();
  const t = useTranslations(currentLang);

  const [formData, setFormData] = useState({
    fiscal_name: "",
    nif_cif: "",
    address: "",
    country: "ES",
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
      <div className="flex gap-4">
      <label className="form-control w-1/4">
        <div className="label">
          <span className="label-text pl-4">{t('cart.countryPlaceholder')}:</span>
        </div>
        <select
          placeholder={t('cart.countryPlaceholder')}
          className="select select-bordered"
          value={formData.country}
          onChange={(e) =>
            setFormData({ ...formData, country: e.target.value })
          }
        >
          {Object.entries(countries[currentLang]).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </label>
      </div>
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

