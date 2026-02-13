import React, { useState, useEffect, useRef, useMemo } from 'react';
import { addToCart, calculateDiscount } from '@hooks/useCart';
import toast from 'react-hot-toast';
import { useI18n } from '@hooks/useI18n';
import { useTranslations } from '@i18n/utils';

export function VariationOption({ variant, isSelected, onSelect, isPreOrder, isReservaB2B }) {
  const isOutOfStock = !isPreOrder && !isReservaB2B && variant.stock_actual <= 0;
  const label = [variant.talla, variant.color].filter(Boolean).join(' / ');

  return (
    <button
      type="button"
      onClick={() => onSelect(variant)}
      disabled={isOutOfStock}
      className={[
        'relative px-2.5 py-1 text-sm border rounded transition-all duration-150',
        isSelected
          ? 'border-roots-bark bg-roots-bark text-roots-sand font-medium'
          : isOutOfStock
            ? 'border-base-300 text-base-300 cursor-not-allowed line-through'
            : 'border-base-300 text-roots-earth hover:border-roots-clay hover:text-roots-bark',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export function ProductCard({ product }) {
  const { currentLang } = useI18n();
  const t = useTranslations(currentLang);

  const notify = () => toast.success('Producto añadido al carrito');

  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(node);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [quantity, setQuantity] = useState(1);

  const { isPreOrder, isReservaB2B } = useMemo(() => {
    let isPreOrder = false;
    let isReservaB2B = false;
    for (const tag of product.tags) {
      const lower = tag.toLowerCase();
      if (lower === 'preventa') isPreOrder = true;
      if (lower === 'reserva b2b') isReservaB2B = true;
      if (isPreOrder && isReservaB2B) break;
    }
    return { isPreOrder, isReservaB2B };
  }, [product.tags]);

  const { totalPrice, unitPrice } = useMemo(() => {
    if (!selectedVariant) return { totalPrice: 0, unitPrice: '0.00' };
    const price = Number(selectedVariant.precio);
    const discount = calculateDiscount(product.tags[0], quantity);
    const factor = 1 - discount / 100;
    return {
      totalPrice: quantity * price * factor,
      unitPrice: (price * factor).toFixed(2)
    };
  }, [selectedVariant, quantity, product.tags]);

  const handleQuantityChange = e => {
    let val = parseInt(e.target.value, 10) || 1;
    if (val < 1) val = 1;
    if (!isPreOrder && !isReservaB2B && selectedVariant && val > selectedVariant.stock_actual) {
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

  const isOutOfStock = !selectedVariant || (!isPreOrder && !isReservaB2B && selectedVariant.stock_actual < 1);

  return (
    <div
      ref={ref}
      className={[
        'card-b2b flex flex-col justify-between h-full overflow-hidden',
        'transition-all duration-500 ease-out',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      ].join(' ')}
    >
      {/* Image area */}
      <div className="relative">
        {isPreOrder && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-warning text-warning-content rounded">
              {t('product.preOrder')}
            </span>
          </div>
        )}

        {product.imagen && (
          <div className="aspect-square bg-base-200/50 overflow-hidden">
            <img
              src={product.imagen}
              alt={product.nombre}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Header: name + tags */}
        <div>
          <h2 className="text-base font-semibold text-roots-bark leading-snug mb-1.5">
            {product.nombre}
          </h2>
          <div className="flex flex-wrap gap-1">
            {product.tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] font-medium uppercase tracking-wider text-roots-clay bg-base-200 px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Variants */}
        {product.variants?.length > 1 && (
          <div>
            <p className="text-xs font-medium text-roots-earth mb-1.5">{t('product.variant')}:</p>
            <div className="flex flex-wrap gap-1.5">
              {product.variants.map(variant => (
                <VariationOption
                  key={variant.ID_sku}
                  variant={variant}
                  isSelected={selectedVariant?.ID_sku === variant.ID_sku}
                  onSelect={setSelectedVariant}
                  isPreOrder={isPreOrder}
                  isReservaB2B={isReservaB2B}
                />
              ))}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price + controls */}
        <div className="space-y-2 pt-2 border-t border-base-300/40">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-roots-bark tabular-nums">
              {totalPrice.toFixed(2)} €
            </span>
            <span className="text-xs text-roots-clay">
              {isOutOfStock ? t('product.noStock') : ''}
            </span>
          </div>

          {selectedVariant && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <label className="text-xs text-roots-earth">{t('product.quantity')}:</label>
                <input
                  type="number"
                  min="1"
                  {...(!isPreOrder && !isReservaB2B && selectedVariant
                    ? { max: selectedVariant.stock_actual }
                    : {})}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-16 h-8 text-sm text-center border border-base-300 rounded bg-base-100 focus:border-roots-clay focus:outline-none transition-colors tabular-nums"
                />
              </div>
              <div className="text-[11px] text-roots-clay text-right whitespace-nowrap">
                *{t('product.pricePerUnit')}: {unitPrice} €
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={[
              'btn btn-sm w-full h-10 text-sm font-medium rounded transition-all duration-150',
              isOutOfStock
                ? 'btn-disabled bg-base-200 text-base-300 border-base-300'
                : 'btn-primary hover:shadow-soft active:scale-[0.98]',
            ].join(' ')}
          >
            {t('product.add')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductsByTag({ catalog }) {
  const grouped = useMemo(() => {
    const groups = catalog.reduce((acc, product) => {
      product.tags.forEach(tag => {
        if (!acc[tag]) acc[tag] = [];
        acc[tag].push(product);
      });
      return acc;
    }, {});
    const orderedTags = Object.keys(groups)
      .filter(tag => tag.toLowerCase() !== 'bundle');
    if (groups['bundle']) orderedTags.push('bundle');
    return { groups, orderedTags };
  }, [catalog]);

  return (
    <div className="max-w-7xl mx-auto w-full space-y-16">
      {grouped.orderedTags.map(tag => (
        <section key={tag}>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-roots-bark tracking-tight uppercase">
              {tag}
            </h2>
            <div className="flex-1 h-px bg-base-300/60" />
            <span className="text-xs text-roots-clay font-medium tabular-nums">
              {grouped.groups[tag].length} {grouped.groups[tag].length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {grouped.groups[tag].map(product => (
              <ProductCard key={product.ID_producto} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default ProductCard;
