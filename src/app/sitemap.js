import { PRODUCTS } from './lib/products';

export default function sitemap() {
  return PRODUCTS.map(product => ({
    url: `/products/${product.slug}`,
    lastModified: new Date().toISOString(),
  }));
}
