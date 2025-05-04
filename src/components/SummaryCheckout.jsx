import { useTranslations } from "@i18n/utils";
import { useI18n } from "@hooks/useI18n";
import { vatRates } from "@data/vatRates";
import { calculateTotals } from "@hooks/useCart";

export default function SummaryCheckout({ customerInfo }) {
    const { currentLang } = useI18n();
    const t = useTranslations(currentLang);

    // Si el cliente es de España el envio es gratis si supero los 200€ o si el cliente es de España y de Canarias el envio siempre es gratis
    const isCanaryIsland = customerInfo.country === "ES-CN";
    const isNationalShipping = (customerInfo.country === "ES" || isCanaryIsland);
    const isInternationalShipping = customerInfo.country !== "ES" && !isCanaryIsland;
    
    
    // Calcula el total
    const vatRate = vatRates[customerInfo.country]?.vat || 21;
    const { total_sin_iva, iva, total_recargo, total_factura } = calculateTotals({countryCode: customerInfo.country, isRecharge: customerInfo.isRecharge});
    
    // Si el cliente no es de España se tiene que calcular el IVA de cada pais y el envio es gratis cuando supero los 400€
    const isFreeShippingInternational = (total_sin_iva + iva > 400) && isInternationalShipping;
    const isFreeShipping = (total_sin_iva + iva > 200) || (isNationalShipping && isCanaryIsland);

    let total_factura_envio = total_factura + (isFreeShipping ? 0.00 : 15.00);
    if (isNationalShipping) {
      total_factura_envio = total_factura + (isFreeShipping ? 0.00 : 5.00);
    }
    return (
        <div className="flex justify-end m-20 px-20">
            <div className="flex flex-col gap-2 w-1/5">
                <div className="flex text-xs font-bold justify-between">{t('invoice.total.totalNoTax')}: <span className="flex">{total_sin_iva.toFixed(2)} €</span></div>
                <div className="flex text-xs font-bold justify-between">{t('invoice.total.iva')} ({vatRate}%): <span className="flex">{iva.toFixed(2)} €</span></div>
                {customerInfo.isRecharge && (
                <div className="flex text-xs font-bold justify-between">{t('invoice.total.recharge')}: <span className="flex">{total_recargo.toFixed(2)} €</span></div>
                )}
                {isNationalShipping ? 
                    <div className="flex text-xs font-bold justify-between">{t('invoice.total.shipping').toUpperCase()}: <span className="flex">{isFreeShipping ? 0.00.toFixed(2) : 5.00.toFixed(2)} €</span></div>
                    : <div className="flex text-xs font-bold justify-between">{t('invoice.total.shipping').toUpperCase()}: <span className="flex">{isFreeShippingInternational ? 0.00.toFixed(2) : 15.00.toFixed(2)} €</span></div>
                }
                <div className="divider"></div>
                <div className="flex text-lg font-bold justify-between">{t('invoice.total.total')}: <span className="flex">{total_factura_envio.toFixed(2)} €</span></div>
            </div>
        </div>
    );
}