import { useState } from "react";
import { itemsStore, removeFromCart, removeAllFromCart } from "@hooks/useCart"
import InvoiceDownload from "@components/invoice/InvoiceDownload";


export default function CartTable({DNI, IBAN}) {
  const [listCart, setListCart] = useState(itemsStore.get('cart'))

  const handleDeleteElementFromCart = ((element) => {
    removeFromCart(element)
    setListCart(itemsStore.get('cart')) 
  })

  const handleDeleteAllElementsFromCart = () => {
    removeAllFromCart()
    setListCart(itemsStore.get('cart'))
  }

  const total = listCart.reduce((acc, item) => acc + item.quantity * item.price, 0)
  return (
    <>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>
                <label>
                  <input type="checkbox" className="checkbox" />
                </label>
              </th>
              <th>Nombre</th>
              <th>Color</th>
              <th className="text-center">Cantidad</th>
              <th>Precio por Unidad</th>
              <th>Descuento</th>
              <th>Precio Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {
              listCart.map((item) => {
                const single_price = item.price
                const discount = 1 - (item.discount / 100) 
                const total_price = (item.quantity * single_price * discount).toFixed(2)
                return (
                <tr key={item.id}>
                  <th>
                    <label>
                      <input type="checkbox" className="checkbox" />
                    </label>
                  </th>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle h-12 w-12">
                          <img
                            src={item.product_img}
                            alt="Avatar Tailwind CSS Component"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{item.name}</div>
                        <div className="text-sm opacity-50">{item.size}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">{item.color}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-center">€{item.price}</td>
                  <td className="text-center">{item.discount}</td>
                  <td className="text-end">€ {total_price}</td>
                  <th>
                    <button 
                      className="btn btn-xs btn-outline btn-error" 
                      onClick={() => handleDeleteElementFromCart(item)}
                    >Eliminar</button>
                  </th>
                </tr>
              )})
            }
          </tbody>
          <tfoot>
            <tr>
              <th></th>
              <th>Nombre</th>
              <th>Color</th>
              <th className="text-center">Cantidad</th>
              <th>Precio por Unidad</th>
              <th>Descuento</th>
              <th>Precio Total</th>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex justify-between pt-8">
        <InvoiceDownload final_items={listCart} total={total} dni={DNI} iban={IBAN} />
        <button className="btn btn-error btn-md" onClick={() => handleDeleteAllElementsFromCart()}>
            Eliminar todo
        </button>
      </div>
    </>
  )}