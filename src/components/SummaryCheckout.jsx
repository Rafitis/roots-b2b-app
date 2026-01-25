import { useTranslations } from "@i18n/utils";
import { useI18n } from "@hooks/useI18n";
import { useCartTotals } from "@hooks/useCart";

export default function SummaryCheckout({ customerInfo }) {
    const { currentLang } = useI18n();
    const t = useTranslations(currentLang);

    // ✅ NUEVO: Usar hook reactivo y memoizado (solución al bug de race condition)
    // Lee directamente del store, siempre actualizado
    const { total_sin_iva, iva, recargo, shipping, total_factura: total_factura_envio, vatRate } = useCartTotals(customerInfo, true);
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