import { askClaudeWithImage } from '../../lib/claude';
import { PROMPTS } from '../../constants/prompts';
import { callWithRetry, generateId } from './utils';
import type {
  OCRProduct,
  OCRTicketResponse,
  OCRFridgeResponse,
  RescanResponse,
  ScanResult,
  PantryItem,
} from '../../types';

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

export async function rescanFridge(
  base64: string,
  currentItems: PantryItem[],
): Promise<RescanResponse> {
  const itemsList = currentItems
    .filter((i) => i.status === 'fresh' || i.status === 'expiring')
    .map((i) => i.name)
    .join(', ');

  return callWithRetry<RescanResponse>(() =>
    askClaudeWithImage({
      system: PROMPTS.RESCAN_FRIDGE,
      prompt: `Productos actuales en mi inventario: ${itemsList}\n\nCompara con lo que ves en la foto.`,
      imageBase64: base64,
    }),
  );
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
