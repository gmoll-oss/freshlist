export interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchase_date: string;
  estimated_expiry: string;
  status: 'fresh' | 'expiring' | 'expired' | 'used' | 'thrown';
  confidence: 'alta' | 'media' | 'baja';
}

export interface MealPlan {
  id: string;
  plan_date: string;
  meal_name: string;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  prep_time_minutes: number;
  servings: number;
  cooked: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  source: 'manual' | 'voice' | 'ai_suggestion' | 'auto';
  purchased: boolean;
  deal_price?: number;
  regular_price?: number;
  store?: string;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  total_saved_euros: number;
  total_products_saved: number;
  total_recipes_cooked: number;
}

export interface PantryStaple {
  id: string;
  name: string;
  category: 'aceites' | 'condimentos' | 'frescos' | 'despensa' | 'salsas';
  avg_restock_days: number;
  last_purchased: string | null;
  status: 'stocked' | 'low' | 'out';
  auto_add_to_list: boolean;
}

export interface WeeklySummary {
  meals_cooked: number;
  products_saved: number;
  products_thrown: number;
  euros_saved: number;
  favorite_meal: string;
  veggie_change_pct: number;
}

// OCR types

export interface OCRProduct {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimated_days_fresh: number;
  confidence: 'alta' | 'media' | 'baja';
}

export interface OCRTicketResponse {
  store: string;
  products: OCRProduct[];
}

export interface OCRFridgeResponse {
  products: OCRProduct[];
}

export type ScanStatus = 'idle' | 'capturing' | 'processing' | 'done' | 'error';

export interface ScanResult {
  mode: 'ticket' | 'fridge';
  store?: string;
  products: PantryItem[];
  raw?: OCRProduct[];
}
