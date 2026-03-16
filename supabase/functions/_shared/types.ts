export interface ScrapedOffer {
  store_id: string;
  store_name: string;
  product_name: string;
  description?: string;
  original_price?: number;
  offer_price: number;
  discount_pct?: number;
  category?: string;
  image_url?: string;
  valid_from?: string;
  valid_until?: string;
  source_url?: string;
  external_id?: string;
}

export interface ScrapeResult {
  store_id: string;
  offers: ScrapedOffer[];
  error?: string;
}

export interface Scraper {
  storeId: string;
  storeName: string;
  scrape(): Promise<ScrapeResult>;
}
