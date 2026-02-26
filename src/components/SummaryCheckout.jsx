import { useTranslations } from "@i18n/utils";
import { useI18n } from "@hooks/useI18n";
import { useCartTotals } from "@hooks/useCart";

export default function SummaryCheckout({ customerInfo, customDiscount = 0 }) {
    const { currentLang } = useI18n();
    const t = useTranslations(currentLang);

    const { total_sin_iva, iva, recargo, shipping, total_factura: total_factura_envio, vatRate } = useCartTotals(customerInfo, true);

    return (
        <div className="flex justify-end py-8 px-4 md:px-0">
            <div className="w-full max-w-xs space-y-2">
                <div className="flex items-center justify-between text-sm text-roots-earth">
                    <span>{t('invoice.total.totalNoTax')}</span>
                    <span className="tabular-nums font-medium">{total_sin_iva.toFixed(2)} €</span>
                </div>
                <div className="flex items-center justify-between text-sm text-roots-earth">
                    <span>{t('invoice.total.iva')} ({vatRate}%)</span>
                    <span className="tabular-nums font-medium">{iva.toFixed(2)} €</span>
                </div>
                {customerInfo.isRecharge && (
                    <div className="flex items-center justify-between text-sm text-roots-earth">
                        <span>{t('invoice.total.recharge')}</span>
                        <span className="tabular-nums font-medium">{recargo.toFixed(2)} €</span>
                    </div>
                )}
                <div className="flex items-center justify-between text-sm text-roots-earth">
                    <span>{t('invoice.total.shipping').toUpperCase()}</span>
                    <span className="tabular-nums font-medium">{shipping.toFixed(2)} €</span>
                </div>
                {customDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm text-success">
                        <span>{t('invoice.total.customDiscount')}</span>
                        <span className="tabular-nums font-medium">-{customDiscount.toFixed(2)} €</span>
                    </div>
                )}
                <div className="border-t border-base-300/60 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-roots-bark">{t('invoice.total.total')}</span>
                        <span className="text-lg font-bold text-roots-bark tabular-nums">{Math.max(0, total_factura_envio - customDiscount).toFixed(2)} €</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
