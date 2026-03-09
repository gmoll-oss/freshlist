import { lookupBarcode } from '../services/barcode/barcodeService';

// Mock fetch globally
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('barcodeService', () => {
  it('returns product data for valid barcode', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Leche Entera',
          brands: 'Pascual',
          categories_tags: ['en:dairy'],
          quantity: '1L',
          image_front_small_url: 'https://example.com/img.jpg',
        },
      }),
    });

    const result = await lookupBarcode('8410128000101');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Leche Entera');
    expect(result!.brand).toBe('Pascual');
    expect(result!.category).toBe('Lacteos');
    expect(result!.barcode).toBe('8410128000101');
  });

  it('prefers Spanish product name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Whole Milk',
          product_name_es: 'Leche Entera',
          categories_tags: [],
        },
      }),
    });

    const result = await lookupBarcode('1234');
    expect(result!.name).toBe('Leche Entera');
  });

  it('returns null for unknown barcode', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 0 }),
    });

    const result = await lookupBarcode('0000000000000');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await lookupBarcode('1234');
    expect(result).toBeNull();
  });

  it('maps categories correctly', async () => {
    const testCases: [string[], string][] = [
      [['en:meats'], 'Carnes'],
      [['en:fresh-fruits'], 'Frutas'],
      [['en:frozen-foods'], 'Congelados'],
      [[], 'Otro'],
    ];

    for (const [tags, expected] of testCases) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 1,
          product: {
            product_name: 'Test',
            categories_tags: tags,
          },
        }),
      });

      const result = await lookupBarcode('test');
      expect(result!.category).toBe(expected);
    }
  });
});
