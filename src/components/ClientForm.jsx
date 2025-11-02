// src/components/CustomerForm.jsx
import { useEffect, useState } from "react";
import { useTranslations } from '@i18n/utils';
import { useI18n } from "@hooks/useI18n";
import { countries } from "@i18n/ui";

const CustomerForm = ({ onStateChange, initialData }) => {
  const { currentLang } = useI18n();
  const t = useTranslations(currentLang);

  const [formData, setFormData] = useState({
    fiscal_name: initialData?.fiscal_name || "",
    nif_cif: initialData?.nif_cif || "",
    address: initialData?.address || "",
    country: initialData?.country || "ES",
    isRecharge: initialData?.isRecharge || false,
    shopify_order_number: initialData?.shopify_order_number || "",
  });

  // Cargar datos iniciales solo cuando initialData tenga valores
  useEffect(() => {
    if (initialData && (initialData.fiscal_name || initialData.nif_cif || initialData.address)) {
      setFormData({
        fiscal_name: initialData.fiscal_name || "",
        nif_cif: initialData.nif_cif || "",
        address: initialData.address || "",
        country: initialData.country || "ES",
        isRecharge: initialData.isRecharge || false,
        shopify_order_number: initialData.shopify_order_number || "",
      });
    }
  }, [initialData?.fiscal_name, initialData?.nif_cif, initialData?.address, initialData?.country, initialData?.shopify_order_number]);

  // Cada vez que el formulario cambie, se notifica al padre
  // Nota: NO incluir onStateChange en dependencias para evitar loops
  useEffect(() => {
    onStateChange(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

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

      {/* Mostrar número de Shopify si existe */}
      {formData.shopify_order_number && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="text-sm text-blue-700 font-semibold mb-1">
            Número de Shopify (Original):
          </div>
          <div className="text-base text-blue-900 font-mono">
            {formData.shopify_order_number}
          </div>
          <div className="text-xs text-blue-600 mt-2">
            Este número se preservará en la nueva factura
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerForm;

