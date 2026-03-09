import { lightColors, darkColors, spacing, radius, fonts } from '../constants/theme';

describe('theme constants', () => {
  it('lightColors has all required keys', () => {
    expect(lightColors.bg).toBeDefined();
    expect(lightColors.card).toBeDefined();
    expect(lightColors.text).toBeDefined();
    expect(lightColors.green600).toBeDefined();
    expect(lightColors.border).toBeDefined();
  });

  it('darkColors has all the same keys as lightColors', () => {
    const lightKeys = Object.keys(lightColors).sort();
    const darkKeys = Object.keys(darkColors).sort();
    expect(darkKeys).toEqual(lightKeys);
  });

  it('spacing values are positive numbers', () => {
    Object.values(spacing).forEach((v) => {
      expect(typeof v).toBe('number');
      expect(v).toBeGreaterThan(0);
    });
  });

  it('radius values are positive numbers', () => {
    Object.values(radius).forEach((v) => {
      expect(typeof v).toBe('number');
      expect(v).toBeGreaterThan(0);
    });
  });

  it('fonts has all 4 weights', () => {
    expect(fonts.regular).toBeDefined();
    expect(fonts.medium).toBeDefined();
    expect(fonts.bold).toBeDefined();
    expect(fonts.black).toBeDefined();
  });
});
