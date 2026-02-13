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
  useEffect(() => {
    onStateChange(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  return (
    <div className="card-b2b p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-roots-earth">{t('cart.namePlaceholder')}</label>
          <input
            type="text"
            placeholder={t('cart.namePlaceholder')}
            className="input-b2b w-full"
            value={formData.fiscal_name}
            onChange={(e) => setFormData({ ...formData, fiscal_name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-roots-earth">{t('cart.nifPlaceholder')}</label>
          <input
            type="text"
            placeholder={t('cart.nifPlaceholder')}
            className="input-b2b w-full"
            value={formData.nif_cif}
            onChange={(e) => setFormData({ ...formData, nif_cif: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-roots-earth">{t('cart.addressPlaceholder')}</label>
          <input
            type="text"
            placeholder={t('cart.addressPlaceholder')}
            className="input-b2b w-full"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-roots-earth">{t('cart.countryPlaceholder')}</label>
          <select
            className="select select-bordered w-full bg-base-100 border-base-300 focus:border-roots-clay focus:outline-none transition-colors"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          >
            {Object.entries(countries[currentLang]).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <input
          type="checkbox"
          className="checkbox checkbox-sm border-base-300"
          checked={formData.isRecharge}
          onChange={(e) => setFormData({ ...formData, isRecharge: e.target.checked })}
          id="recharge-check"
        />
        <label htmlFor="recharge-check" className="text-sm text-roots-earth cursor-pointer">
          {t('cart.tax')}
        </label>
      </div>

      {/* Mostrar número de Shopify si existe */}
      {formData.shopify_order_number && (
        <div className="flex items-start gap-3 p-3 bg-info/5 border border-info/20 rounded-lg">
          <div className="flex-1">
            <div className="text-xs font-medium text-info mb-0.5">
              Número de Shopify (Original):
            </div>
            <div className="text-sm font-mono font-semibold text-roots-bark">
              {formData.shopify_order_number}
            </div>
            <div className="text-[11px] text-info/70 mt-1">
              Este número se preservará en la nueva factura
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerForm;
