import { useState, useEffect, useCallback } from 'react';
import { checkPremium } from '../services/purchases/revenuecat';

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const premium = await checkPremium();
      setIsPremium(premium);
    } catch {
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { isPremium, loading, refresh };
}
