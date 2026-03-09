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

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlan {
  id: string;
  week_start: string;
  day: string;
  meal_type: MealType;
  meal_name: string;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  prep_time_minutes: number;
  servings: number;
  batch_note: string | null;
  reuses_from: string | null;
  cooked: boolean;
}

export interface MealPlanAIResponse {
  meals: {
    day: string;
    meal_type: MealType;
    meal_name: string;
    ingredients: { name: string; amount: string }[];
    steps: string[];
    prep_time_minutes: number;
    servings: number;
    batch_note: string | null;
    reuses_from: string | null;
  }[];
  shopping_needed: { name: string; reason: string }[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  source: 'manual' | 'voice' | 'ai_suggestion' | 'auto';
  purchased: boolean;
  store?: string;
  meal_plan_id?: string;
}

export interface UserStats {
  current_streak: number;
  longest_streak: number;
  total_saved_euros: number;
  total_products_saved: number;
  total_products_thrown: number;
  total_recipes_cooked: number;
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
  id?: string;
  week_start: string;
  meals_cooked: number;
  meals_planned: number;
  products_saved: number;
  products_thrown: number;
  euros_saved: number;
  favorite_meal: string | null;
  ai_feedback: string | null;
}

export interface WeeklyInsightResponse {
  main_insight: string;
  recommendation: string;
  encouragement: string;
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

export interface UserPreferences {
  display_name: string | null;
  people_count: number;
  meals_config: { breakfast: boolean; lunch: boolean; dinner: boolean };
  weekly_meals: number;
  diet_type: string[];
  intolerances: string[];
  cooking_time: 'rapido' | 'normal' | 'sin_prisa';
  health_goal: string | null;
  budget_weekly: number | null;
  onboarding_done: boolean;
}

export interface RescanResponse {
  still_present: string[];
  consumed: string[];
  new_items: OCRProduct[];
}

// Shopping reminders — "recordar para la próxima"
export interface ShoppingReminder {
  id: string;
  name: string;
  note?: string;
  created_at: string;
  completed: boolean;
}

// Offers & deals
export interface SupermarketOffer {
  id: string;
  store_id: string;
  store_name: string;
  product_name: string;
  original_price: number;
  offer_price: number;
  discount_pct: number;
  valid_until: string;
  category: string;
  image_url?: string;
}

export interface OfferMatch {
  offer: SupermarketOffer;
  matched_item: string; // shopping list or pantry item name it matches
  relevance: 'exact' | 'similar' | 'category';
}

// User location
export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  postal_code?: string;
}

export interface NearbyStore {
  store_id: string;
  store_name: string;
  distance_km: number;
  address: string;
  offers_count: number;
}

export type ScanStatus = 'idle' | 'capturing' | 'processing' | 'done' | 'error';

export interface ScanResult {
  mode: 'ticket' | 'fridge';
  store?: string;
  products: PantryItem[];
  raw?: OCRProduct[];
}
