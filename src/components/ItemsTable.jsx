import { useTranslations } from "@i18n/utils";
import { useI18n } from "@hooks/useI18n";

export default function ItemsTable({items, onDelete, onUpdateQuantity}){
  const { currentLang } = useI18n();
  const t = useTranslations(currentLang);

  return (
    <div className="overflow-auto max-h-[800px] mb-10">
    <table className="table w-full">
      <thead>
        <tr>
          <th>
            <label>
              <input type="checkbox" className="checkbox" />
            </label>
          </th>
          <th>{t('table.name')}</th>
          <th>{t('table.color')}</th>
          <th>{t('table.quantity')}</th>
          <th>{t('table.priceUnit')}</th>
          <th>{t('table.discount')}</th>
          <th>{t('table.total')}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {
          items.map((item) => {
            const single_price = Number(item.price);
            const discountFactor = 1 - Number(item.discount) / 100;
            const total_price = (
              item.quantity *
              single_price *
              discountFactor
            ).toFixed(2);
            return (
              <tr key={item.id.toString()}>
                <th>
                  <label>
                    <input type="checkbox" className="checkbox" />
                  </label>
                </th>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="mask mask-squircle h-12 w-12">
                        <img src={item.product_img} alt="Avatar" />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <div className="text-sm opacity-50">{item.size}</div>
                    </div>
                  </div>
                </td>
                <td className="text-center">{item.color}</td>
                <td>
                  <input
                    type="text"
                    value={item.quantity}
                    className="input input-bordered input-xs w-10 max-w-xs" 
                    onChange={(e) => onUpdateQuantity(e, item)}
                  />
                </td>
                {/* <td className="text-center">{item.quantity}</td> */}
                <td>€{item.price}</td>
                <td>{item.discount} %</td>
                <td>€ {total_price}</td>
                <th>
                  <button
                    className="btn btn-xs btn-outline btn-error"
                    onClick={() => onDelete(item)}
                  >
                    {t('table.delete')}
                  </button>
                </th>
              </tr>
            );
          })
        }
      </tbody>
      <tfoot>
        <tr>
          <th></th>
          <th>{t('table.name')}</th>
          <th>{t('table.color')}</th>
          <th>{t('table.quantity')}</th>
          <th>{t('table.priceUnit')}</th>
          <th>{t('table.discount')}</th>
          <th>{t('table.total')}</th>
          <th></th>
        </tr>
      </tfoot>
    </table>
    </div>
  )
}


