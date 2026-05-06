import { describe, it, expect } from 'vitest';
import { buildVariantImageMap, resolveVariantImage } from '../../lib/shopify-mappers.js';

describe('buildVariantImageMap', () => {
  it('crea un map id → src desde product.images', () => {
    const product = {
      images: [
        { id: 1, src: 'https://cdn.shopify.com/a.jpg' },
        { id: 2, src: 'https://cdn.shopify.com/b.jpg' }
      ]
    };
    const map = buildVariantImageMap(product);
    expect(map.size).toBe(2);
    expect(map.get(1)).toBe('https://cdn.shopify.com/a.jpg');
    expect(map.get(2)).toBe('https://cdn.shopify.com/b.jpg');
  });

  it('devuelve un map vacío cuando product.images es undefined', () => {
    const map = buildVariantImageMap({});
    expect(map.size).toBe(0);
  });

  it('devuelve un map vacío cuando product es null', () => {
    const map = buildVariantImageMap(null);
    expect(map.size).toBe(0);
  });
});

describe('resolveVariantImage', () => {
  const imageMap = new Map([
    [1, 'https://cdn.shopify.com/a.jpg'],
    [2, 'https://cdn.shopify.com/b.jpg']
  ]);

  it('devuelve la URL cuando image_id matchea', () => {
    expect(resolveVariantImage({ image_id: 1 }, imageMap)).toBe('https://cdn.shopify.com/a.jpg');
  });

  it('devuelve null cuando image_id es null', () => {
    expect(resolveVariantImage({ image_id: null }, imageMap)).toBeNull();
  });

  it('devuelve null cuando la variante no tiene image_id', () => {
    expect(resolveVariantImage({}, imageMap)).toBeNull();
  });

  it('devuelve null cuando image_id no está en el map', () => {
    expect(resolveVariantImage({ image_id: 999 }, imageMap)).toBeNull();
  });

  it('devuelve null cuando el map está vacío', () => {
    expect(resolveVariantImage({ image_id: 1 }, new Map())).toBeNull();
  });
});
