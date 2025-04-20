import React, { useState, useEffect, useRef } from 'react';
import { addToCart, calculateDiscount } from '@hooks/useCart';
import toast, { Toaster } from 'react-hot-toast';

const notify = () => toast.success('Producto añadido al carrito');

export function VariationOption({ variant, isSelected, onSelect, isPreOrder }) {
  const isOutOfStock = !isPreOrder && variant.stock_actual <= 0;
  const label = [variant.talla, variant.color].filter(Boolean).join(' / ');

  return (
    <button
      type="button"
      onClick={() => onSelect(variant)}
      className={[
        'relative px-3 py-1 border rounded-md m-1 transition overflow-hidden',
        isSelected ? 'border-blue-500' : 'border-gray-200',
        isOutOfStock ? 'text-gray-300' : 'hover:border-gray-700'
      ].join(' ')}
    >
      <span className="relative z-10">{label}{isOutOfStock}</span>
      {isOutOfStock && (
        <span
          className="absolute inset-0"
        />
      )}
    </button>
  );
}

export function ProductCard({ product }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  // IntersectionObserver para activar animación al hacer scroll
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(ref.current);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [unitPrice, setUnitPrice] = useState(selectedVariant?.precio ?? 0);

  const isPreOrder = product.tags.some(tag => tag.toLowerCase() === 'preventa');

  useEffect(() => {
    if (!selectedVariant) return;
    const price = Number(selectedVariant.precio);
    const discount = calculateDiscount(product.tags[0], quantity);
    const factor = 1 - discount / 100;
    setTotalPrice(quantity * price * factor);
    setUnitPrice((price * factor).toFixed(2));
  }, [selectedVariant, quantity]);

  const handleQuantityChange = e => {
    let val = parseInt(e.target.value, 10) || 1;
    if (val < 1) val = 1;
    if (!isPreOrder && selectedVariant && val > selectedVariant.stock_actual) {
      val = selectedVariant.stock_actual;
    }
    setQuantity(val);
  };

  const handleAddToCart = () => {
    if (quantity < 1) return;
    addToCart({
      tag: product.tags[0],
      product,
      quantity,
      variant: selectedVariant,
      isPreOrder
    });
    setQuantity(1);
    notify();
  };

  const isOutOfStock = !selectedVariant || (!isPreOrder && selectedVariant.stock_actual < 1);

  return (
    <div
      ref={ref}
      className={[
        'relative max-w-sm bg-white shadow-md rounded-lg overflow-hidden p-4 flex flex-col justify-between h-full',
        'transition-all duration-700 ease-out',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      ].join(' ')}
    >
      <Toaster position="bottom-right" reverseOrder={false} />

      {isPreOrder && (
        <div className="absolute top-2 right-2 bg-yellow-300 text-xs font-semibold uppercase px-2 py-1 rounded z-10">
          PREVENTA
        </div>
      )}

      <div>
        {product.imagen && (
          <img
            src={product.imagen}
            alt={product.nombre}
            className="w-full h-auto object-cover mb-4"
          />
        )}
        <h2 className="text-xl font-semibold mb-2">{product.nombre}</h2>

        <div className="flex flex-wrap mb-2">
          {product.tags.map(tag => (
            <span
              key={tag}
              className="text-xs bg-gray-200 rounded-full px-2 py-1 mr-2 mb-2"
            >
              {tag.toUpperCase()}
            </span>
          ))}
        </div>

        {product.variants?.length > 1 && (
          <div className="mb-4">
            <p className="font-medium mb-2">Elige variante:</p>
            <div className="flex flex-wrap">
              {product.variants.map(variant => (
                <VariationOption
                  key={variant.ID_sku}
                  variant={variant}
                  isSelected={selectedVariant?.ID_sku === variant.ID_sku}
                  onSelect={setSelectedVariant}
                  isPreOrder={isPreOrder}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold">€{totalPrice.toFixed(2)}</span>
          <span className="text-sm">
            {isOutOfStock ? 'Sin stock' : `Stock: ${selectedVariant.stock_actual}`}
          </span>
        </div>

        {selectedVariant && (
          <div className="flex items-center mb-4">
            <label className="text-sm mr-2">Cantidad:</label>
            <input
              type="number"
              min="1"
              {...(!isPreOrder && selectedVariant
                ? { max: selectedVariant.stock_actual }
                : {})}
              value={quantity}
              onChange={handleQuantityChange}
              className="w-16 border rounded p-1"
            />
          </div>
        )}

        <div className="w-full text-end mb-4">
          <div className="stat-desc">*Precio por Unidad: €{unitPrice}</div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={[
            'w-full py-2 rounded-md text-white text-lg transition',
            isOutOfStock
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          ].join(' ')}
        >
          Añadir al carrito
        </button>
      </div>
    </div>
  );
}

export function ProductsByTag({ catalog }) {
  const grouped = catalog.reduce((acc, product) => {
    product.tags.forEach(tag => {
      if (!acc[tag]) acc[tag] = [];
      acc[tag].push(product);
    });
    return acc;
  }, {});
  const orderedTags = Object.keys(grouped)
    .filter(tag => tag.toLowerCase() !== 'bundle');
  if (grouped['bundle']) orderedTags.push('bundle');

  return (
    <div>
      {orderedTags.map(tag => (
        <section key={tag} className="mb-20">
          <h2 className="text-2xl font-bold mb-4 text-center">{tag.toUpperCase()}</h2>
          <div className="divider"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {grouped[tag].map(product => (
              <ProductCard key={product.ID_producto} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default ProductCard;
