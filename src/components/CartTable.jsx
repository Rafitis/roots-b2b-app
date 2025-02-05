import { useState } from "react";
import { getCart, removeAllFromCart, removeFromCart } from "@hooks/useCart";
import InvoiceDownload from "@components/invoice/InvoiceDownload";
const items = getCart();

export default function CartTable({DNI, IBAN}) {
  const [cart, setCart] = useState(items);


  const total = cart.reduce((acc, item) => acc + item.quantity * item.price, 0)
  const removeItem = (item) => {
    removeFromCart(item)
    setCart(getCart())
  };

  const removeAllItems = () => {
    removeAllFromCart()
    setCart(getCart())
  };
  return (
    <>
<div class="overflow-x-auto">
  <table class="table">
    <thead>
      <tr>
        <th>
          <label>
            <input type="checkbox" class="checkbox" onToggle={(e) => console.log("HOOli")} />
          </label>
        </th>
        <th>Nombre</th>
        <th>Color</th>
        <th class="text-center">Cantidad</th>
        <th>Precio por Unidad</th>
        <th>Descuento</th>
        <th>Precio Total</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {
        cart.map((item) => {
          const single_price = item.price
          const discount = 1 - (item.discount / 100) 
          const total_price = (item.quantity * single_price * discount).toFixed(2)
          return (<tr key={item.id}>
            <th>
              <label>
                <input type="checkbox" class="checkbox" />
              </label>
            </th>
            <td>
              <div class="flex items-center gap-3">
                <div class="avatar">
                  <div class="mask mask-squircle h-12 w-12">
                    <img
                      src={item.product_img}
                      alt="Avatar Tailwind CSS Component"
                    />
                  </div>
                </div>
                <div>
                  <div class="font-bold">{item.name}</div>
                  <div class="text-sm opacity-50">{item.size}</div>
                </div>
              </div>
            </td>
            <td class="text-center">{item.color}</td>
            <td class="text-center">{item.quantity}</td>
            <td class="text-center">€{item.price}</td>
            <td class="text-center">{item.discount}</td>
            <td class="text-end">€ {total_price}</td>
            <th>
              <button class="btn btn-ghost btn-xs" onClick={() => removeItem(item)}>Eliminar</button>
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
        <th class="text-center">Cantidad</th>
        <th>Precio por Unidad</th>
        <th>Descuento</th>
        <th>Precio Total</th>
        <th></th>
      </tr>
    </tfoot>
  </table>
</div>
    <div class="flex justify-between pt-8">
    <InvoiceDownload items={cart} total={total} dni={DNI} iban={IBAN} />
    <button class="btn btn-error btn-md" onClick={removeAllItems}>
        Eliminar todos
    </button>
  </div>
  </>
  )}