import { Trash2 } from 'lucide-react';
import { useTranslations } from "@i18n/utils";
import { useI18n } from "@hooks/useI18n";

export default function ItemsTable({items, onDelete, onUpdateQuantity}){
  const { currentLang } = useI18n();
  const t = useTranslations(currentLang);

  if (items.length === 0) {
    return (
      <div className="card-b2b p-12 text-center">
        <p className="text-roots-clay text-sm">{t('cart.empty') || 'El carrito está vacío'}</p>
        <a
          href={currentLang === 'en' ? '/en/main-view' : '/main-view'}
          className="inline-block mt-3 text-sm font-medium text-roots-bark underline underline-offset-4 decoration-roots-clay/30 hover:decoration-roots-bark transition-colors"
        >
          {t('nav.products')}
        </a>
      </div>
    );
  }

  return (
    <div className="card-b2b overflow-hidden">
      <div className="overflow-auto max-h-[600px]">
        <table className="w-full text-sm">
          <thead className="bg-base-200/60 sticky top-0 z-10">
            <tr className="text-left text-xs font-medium text-roots-earth uppercase tracking-wider">
              <th className="py-3 px-4 w-[40%]">{t('table.name')}</th>
              <th className="py-3 px-3">{t('table.color')}</th>
              <th className="py-3 px-3 text-center">{t('table.quantity')}</th>
              <th className="py-3 px-3 text-right">{t('table.priceUnit')}</th>
              <th className="py-3 px-3 text-right">{t('table.discount')}</th>
              <th className="py-3 px-3 text-right">{t('table.total')}</th>
              <th className="py-3 px-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-300/40">
            {items.map((item) => {
              const single_price = Number(item.price);
              const discountFactor = 1 - Number(item.discount) / 100;
              const total_price = (item.quantity * single_price * discountFactor).toFixed(2);

              return (
                <tr key={item.id.toString()} className="hover:bg-base-200/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-base-200/50 flex-shrink-0">
                        <img src={item.product_img} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-roots-bark truncate">{item.name}</div>
                        <div className="text-xs text-roots-clay">{item.size}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-roots-earth">{item.color}</td>
                  <td className="py-3 px-3">
                    <div className="flex justify-center">
                      <input
                        type="text"
                        value={item.quantity}
                        className="w-14 h-8 text-sm text-center border border-base-300 rounded bg-base-100 focus:border-roots-clay focus:outline-none transition-colors tabular-nums"
                        onChange={(e) => onUpdateQuantity(e, item)}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-roots-earth tabular-nums">{item.price} €</td>
                  <td className="py-3 px-3 text-right">
                    {Number(item.discount) > 0 ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-accent/10 text-accent rounded">
                        -{item.discount}%
                      </span>
                    ) : (
                      <span className="text-roots-clay text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-roots-bark tabular-nums">{total_price} €</td>
                  <td className="py-3 px-3">
                    <button
                      className="p-1.5 rounded text-roots-clay hover:text-error hover:bg-error/10 transition-colors"
                      onClick={() => onDelete(item)}
                      title={t('table.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
