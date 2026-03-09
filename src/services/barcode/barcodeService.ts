/**
 * Barcode product lookup service.
 * Uses Open Food Facts API (free, no key required) for EAN/UPC product data.
 */

export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  image_url?: string;
  quantity?: string;
}

const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v0/product';

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const res = await fetch(`${OPEN_FOOD_FACTS_URL}/${barcode}.json`, {
      headers: { 'User-Agent': 'FreshList/1.0 (contact@freshlist.app)' },
    });
    if (!res.ok) return null;

    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;

    const p = json.product;
    const name =
      p.product_name_es ||
      p.product_name ||
      p.generic_name_es ||
      p.generic_name ||
      '';

    if (!name) return null;

    return {
      barcode,
      name,
      brand: p.brands || undefined,
      category: mapCategory(p.categories_tags),
      image_url: p.image_front_small_url || p.image_url || undefined,
      quantity: p.quantity || undefined,
    };
  } catch {
    return null;
  }
}

function mapCategory(tags?: string[]): string {
  if (!tags || tags.length === 0) return 'Otro';

  const tagStr = tags.join(',').toLowerCase();
  const mapping: [string, string][] = [
    ['dairy', 'Lacteos'],
    ['milk', 'Lacteos'],
    ['cheese', 'Lacteos'],
    ['yogurt', 'Lacteos'],
    ['meat', 'Carnes'],
    ['poultry', 'Carnes'],
    ['fish', 'Pescado'],
    ['seafood', 'Pescado'],
    ['fruit', 'Frutas'],
    ['vegetable', 'Verduras'],
    ['bread', 'Panaderia'],
    ['cereal', 'Cereales'],
    ['pasta', 'Pasta'],
    ['rice', 'Cereales'],
    ['beverage', 'Bebidas'],
    ['drink', 'Bebidas'],
    ['juice', 'Bebidas'],
    ['water', 'Bebidas'],
    ['snack', 'Snacks'],
    ['chocolate', 'Snacks'],
    ['cookie', 'Snacks'],
    ['frozen', 'Congelados'],
    ['sauce', 'Condimentos'],
    ['oil', 'Condimentos'],
    ['spice', 'Condimentos'],
    ['egg', 'Huevos'],
  ];

  for (const [keyword, category] of mapping) {
    if (tagStr.includes(keyword)) return category;
  }
  return 'Otro';
}
