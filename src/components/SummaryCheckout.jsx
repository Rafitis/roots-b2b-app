import { useTranslations } from "@i18n/utils";
import { useI18n } from "@hooks/useI18n";
import { calculateTotals } from "@lib/invoice-calculations.js";

export default function SummaryCheckout({ items = [], customerInfo }) {
    const { currentLang } = useI18n();
    const t = useTranslations(currentLang);

    // Usar función centralizada que incluye todos los cálculos (IVA, envío, recargo)
    const countryCode = customerInfo.country || 'ES';
    const { total_sin_iva, iva, recargo, shipping, total_factura: total_factura_envio, vatRate } = calculateTotals({
      items,
      countryCode,
      applyRecharge: customerInfo.isRecharge,
      includeShipping: true
    });
    return (
        <div className="flex justify-end m-20 px-20">
            <div className="flex flex-col gap-2 w-1/5">
                <div className="flex text-xs font-bold justify-between">{t('invoice.total.totalNoTax')}: <span className="flex">{total_sin_iva.toFixed(2)} €</span></div>
                <div className="flex text-xs font-bold justify-between">{t('invoice.total.iva')} ({vatRate}%): <span className="flex">{iva.toFixed(2)} €</span></div>
                {customerInfo.isRecharge && (
                <div className="flex text-xs font-bold justify-between">{t('invoice.total.recharge')}: <span className="flex">{recargo.toFixed(2)} €</span></div>
                )}
                <div className="flex text-xs font-bold justify-between">{t('invoice.total.shipping').toUpperCase()}: <span className="flex">{shipping.toFixed(2)} €</span></div>
                <div className="divider"></div>
                <div className="flex text-lg font-bold justify-between">{t('invoice.total.total')}: <span className="flex">{total_factura_envio.toFixed(2)} €</span></div>
            </div>
        </div>
    );
}