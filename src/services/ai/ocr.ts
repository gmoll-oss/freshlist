import { askClaudeWithImage } from '../../lib/claude';
import { PROMPTS } from '../../constants/prompts';
import type {
  OCRProduct,
  OCRTicketResponse,
  OCRFridgeResponse,
  ScanResult,
  PantryItem,
} from '../../types';

function parseJSON<T>(raw: string): T {
  // Strip markdown fences if Claude wraps the response
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned);
}

async function callWithRetry<T>(fn: () => Promise<string>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await fn();
      return parseJSON<T>(raw);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function ocrProductToPantryItem(p: OCRProduct): PantryItem {
  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + p.estimated_days_fresh);

  let status: PantryItem['status'] = 'fresh';
  if (p.estimated_days_fresh <= 0) {
    status = 'expired';
  } else if (p.estimated_days_fresh <= 3) {
    status = 'expiring';
  }

  return {
    id: generateId(),
    name: p.name,
    category: p.category,
    quantity: p.quantity,
    unit: p.unit,
    purchase_date: now.toISOString().split('T')[0],
    estimated_expiry: expiry.toISOString().split('T')[0],
    status,
    confidence: p.confidence,
  };
}

export async function scanTicket(base64: string): Promise<ScanResult> {
  const data = await callWithRetry<OCRTicketResponse>(() =>
    askClaudeWithImage({
      system: PROMPTS.OCR_TICKET,
      prompt: 'Analiza este ticket de supermercado.',
      imageBase64: base64,
    }),
  );

  return {
    mode: 'ticket',
    store: data.store,
    products: data.products.map(ocrProductToPantryItem),
    raw: data.products,
  };
}

export async function scanFridge(base64: string): Promise<ScanResult> {
  const data = await callWithRetry<OCRFridgeResponse>(() =>
    askClaudeWithImage({
      system: PROMPTS.OCR_FRIDGE,
      prompt: 'Identifica los productos en esta nevera.',
      imageBase64: base64,
    }),
  );

  return {
    mode: 'fridge',
    products: data.products.map(ocrProductToPantryItem),
    raw: data.products,
  };
}
