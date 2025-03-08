

  import { useState } from "react"
  import { ArrowLeftIcon, CartIcon } from "@assets/Icons.jsx"
  import { addToCart, calculateDiscount } from "@hooks/useCart"
  
  import toast, { Toaster } from 'react-hot-toast';

  const notify = () => toast.success("Producto añadido al carrito")
  export default function AddButton({product, tag}) {

    const initialSize = product?.Talla ? product?.Talla[0] : ""
    const initialColor = product?.Colores ? product?.Colores[0] : ""
    const [quantity, setQuantity] = useState(1)
    const [colorSelected, setColorSelected] = useState(initialColor)
    const [sizeSelected, setSizeSelected] = useState(initialSize)
    const [price, setPrice] = useState(product?.Precio)
    
    function handleAddElementToCart() {
      
      if (quantity === 0) return
      
      addToCart({tag: tag, product: product, quantity: quantity, size: sizeSelected, color: colorSelected})
      
      const quantityInput = document.getElementById("cantidad-producto" + product.id)
      quantityInput.value = ""
      setQuantity(1)
      setColorSelected(initialColor)
      setSizeSelected(initialSize)
      notify()
    }

    const handleUpdatePrice = (e) => {
      if (e.target.value === "") return setPrice(product?.Precio)
      const newQuantity = Number(e.target.value)
      setQuantity(newQuantity)
      const discount = calculateDiscount(tag, newQuantity)
      const discountFactor = 1 - discount / 100;
      const total_price = ( newQuantity * product?.Precio * discountFactor).toFixed(2);
      setPrice(total_price)
    }

    return (
      <div className="flex flex-col">
        <div className="flex gap-2 pb-2">
          {product?.Colores && (
        <div className="label w-full max-w-xs gap-[4px]">
           <span className="label-text">Color:</span>
          <select key="color" className="select select-sm rounded-md select-bordered w-full" onChange={(e) => setColorSelected(e.target.value)}>
              {/* <option disabled>Color</option> */}
              {product?.Colores.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
          </select>
        </div>)
        }
        {product?.Talla && (
          <div className="label w-full max-w-xs gap-[4px]">
            <span className="label-text">Talla:</span>
            <select defaultValue={sizeSelected} key="size" className="select select-sm select-bordered rounded-md w-full max-w-xs" onChange={(e) => setSizeSelected(e.target.value)}>
              {/* <option disabled>Talla</option> */}
              {product?.Talla.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}
      </div>
        <input id={"cantidad-producto" + product?.id} type="text" placeholder="Cantidad" className="input input-sm rounded-md input-bordered w-full max-w-xs mb-2" defaultValue={quantity} onChange={handleUpdatePrice}/>
  
      <div className="card-actions justify-between md:justify-center md:pb-4 md:place-content-center">
        <Toaster position="top-right" reverseOrder={false} />
        <button className="btn btn-sm rounded-md btn-primary w-full font-semibold text-lg hover:bg-indigo-500 transition duration-200 hover:scale-105 text-primary-content hover:text-indigo-50" onClick={handleAddElementToCart}>
          <CartIcon />
          Añadir <ArrowLeftIcon /> {price}€
        </button>
      </div>
    </div>
    )
  }