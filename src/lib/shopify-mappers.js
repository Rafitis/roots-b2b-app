export function buildVariantImageMap(product) {
  return new Map((product?.images || []).map(img => [img.id, img.src]));
}

export function resolveVariantImage(variant, imageMap) {
  if (!variant?.image_id) return null;
  return imageMap.get(variant.image_id) ?? null;
}
