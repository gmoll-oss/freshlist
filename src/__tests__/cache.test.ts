import { cacheSet, cacheGet, cacheClear, clearAllCache } from '../services/offline/cache';

beforeEach(async () => {
  await clearAllCache();
});

describe('offline cache', () => {
  it('stores and retrieves data', async () => {
    await cacheSet('test-key', { value: 42 });
    const result = await cacheGet<{ value: number }>('test-key');
    expect(result).toEqual({ value: 42 });
  });

  it('returns null for missing keys', async () => {
    const result = await cacheGet('nonexistent');
    expect(result).toBeNull();
  });

  it('clears specific key', async () => {
    await cacheSet('a', 1);
    await cacheSet('b', 2);
    await cacheClear('a');

    expect(await cacheGet('a')).toBeNull();
    expect(await cacheGet('b')).toBe(2);
  });

  it('clears all cache', async () => {
    await cacheSet('x', 'hello');
    await cacheSet('y', 'world');
    await clearAllCache();

    expect(await cacheGet('x')).toBeNull();
    expect(await cacheGet('y')).toBeNull();
  });
});
