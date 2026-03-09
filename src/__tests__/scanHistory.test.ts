import { addScanToHistory, getScanHistory, clearScanHistory } from '../services/scan/scanHistory';

// AsyncStorage is auto-mocked by jest-expo

beforeEach(async () => {
  await clearScanHistory();
});

describe('scanHistory', () => {
  it('starts with empty history', async () => {
    const history = await getScanHistory();
    expect(history).toEqual([]);
  });

  it('adds an entry to history', async () => {
    await addScanToHistory({
      mode: 'ticket',
      store: 'Mercadona',
      itemCount: 5,
      itemNames: ['Leche', 'Pan', 'Huevos', 'Tomate', 'Queso'],
    });

    const history = await getScanHistory();
    expect(history).toHaveLength(1);
    expect(history[0].mode).toBe('ticket');
    expect(history[0].store).toBe('Mercadona');
    expect(history[0].itemCount).toBe(5);
    expect(history[0].id).toMatch(/^scan-/);
    expect(history[0].date).toBeDefined();
  });

  it('prepends new entries (newest first)', async () => {
    await addScanToHistory({ mode: 'ticket', itemCount: 3, itemNames: ['a', 'b', 'c'] });
    await addScanToHistory({ mode: 'fridge', itemCount: 7, itemNames: ['d', 'e', 'f', 'g', 'h', 'i', 'j'] });

    const history = await getScanHistory();
    expect(history).toHaveLength(2);
    expect(history[0].mode).toBe('fridge');
    expect(history[1].mode).toBe('ticket');
  });

  it('limits to 50 entries', async () => {
    for (let i = 0; i < 55; i++) {
      await addScanToHistory({ mode: 'ticket', itemCount: 1, itemNames: [`item-${i}`] });
    }

    const history = await getScanHistory();
    expect(history).toHaveLength(50);
  });

  it('clears history', async () => {
    await addScanToHistory({ mode: 'ticket', itemCount: 1, itemNames: ['x'] });
    await clearScanHistory();

    const history = await getScanHistory();
    expect(history).toEqual([]);
  });
});
