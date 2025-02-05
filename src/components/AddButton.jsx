

  import { useState } from "react"
  import { CartIcon } from "@assets/Icons.jsx"
  import { addToCart } from "@hooks/useCart"
  
  import toast, { Toaster } from 'react-hot-toast';
  export default function AddButton({product, tag}) {
  
    const notify = () => toast.success("Producto añadido al carrito")
  
    function handleAddElementToCart() {
      console.log(quantity, sizeSelected, colorSelected)
      addToCart({tag: tag, product: product, quantity: quantity, size: sizeSelected, color: colorSelected})
  
      const quantityInput = document.getElementById("cantidad-producto" + product.id)
      console.log(quantityInput)
      quantityInput.value = ""
      setQuantity(0)
      setColorSelected("")
      setSizeSelected("")
      notify()
    }
  
    const [quantity, setQuantity] = useState(0)
    const [colorSelected, setColorSelected] = useState("")
    const [sizeSelected, setSizeSelected] = useState("")
  
      return (
        <>
        <div class="flex flex-row gap-2 pb-4">
          {product?.Colores && (
        <select defaultValue="Color" key="color" class="select select-bordered w-full max-w-xs" onChange={(e) => setColorSelected(e.target.value)}>
            <option disabled>Color</option>
            {product?.Colores.map((color) => (
              <option key={color} value={color}>{color}</option>
            ))}
        </select>)
        }
        {product?.Talla && (
          <select defaultValue="Talla" key="size" class="select select-bordered w-full max-w-xs" onChange={(e) => setSizeSelected(e.target.value)}>
            <option disabled>Talla</option>
            {product?.Talla.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        )}
    </div>
    <div class="pb-2">
        <input id={"cantidad-producto" + product?.id} type="text" placeholder="Cantidad" class="input input-bordered w-full max-w-xs" onChange={(e) => setQuantity(Number(e.target.value))} />
    </div>
    <div class="card-actions justify-center pb-4">
      <button className="btn btn-primary btn-md" onClick={handleAddElementToCart}>
        <Toaster position="top-right" reverseOrder={false} />
        <CartIcon />
        Añadir producto
      </button>
      </div>
      </>
    )
  }