import { useState, useCallback } from 'react';
import { capturePhoto, pickFromGallery } from '../services/camera';
import { scanTicket, scanFridge } from '../services/ai/ocr';
import { setScanResult, clearScanResult } from '../services/scan/scanStore';
import { insertPantryItems } from '../services/supabase/pantry';
import type { ScanStatus, ScanResult, PantryItem } from '../types';

export function useScan() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastBase64, setLastBase64] = useState<string | null>(null);

  const processImage = useCallback(
    async (base64: string, mode: 'ticket' | 'fridge') => {
      setStatus('processing');
      setError(null);
      try {
        const result =
          mode === 'ticket'
            ? await scanTicket(base64)
            : await scanFridge(base64);
        setScanResult(result);
        setStatus('done');
        return result;
      } catch (e: any) {
        setError(e.message ?? 'Error al procesar la imagen');
        setStatus('error');
        return null;
      }
    },
    [],
  );

  const capture = useCallback(
    async (mode: 'ticket' | 'fridge') => {
      setStatus('capturing');
      setError(null);
      const base64 = await capturePhoto();
      if (!base64) {
        setStatus('idle');
        return null;
      }
      setLastBase64(base64);
      return processImage(base64, mode);
    },
    [processImage],
  );

  const pickImage = useCallback(
    async (mode: 'ticket' | 'fridge') => {
      setStatus('capturing');
      setError(null);
      const base64 = await pickFromGallery();
      if (!base64) {
        setStatus('idle');
        return null;
      }
      setLastBase64(base64);
      return processImage(base64, mode);
    },
    [processImage],
  );

  const retry = useCallback(
    async (mode: 'ticket' | 'fridge') => {
      if (lastBase64) {
        return processImage(lastBase64, mode);
      }
      return capture(mode);
    },
    [lastBase64, processImage, capture],
  );

  const confirm = useCallback(async (products: PantryItem[]) => {
    try {
      await insertPantryItems(products);
      clearScanResult();
      setStatus('idle');
      setLastBase64(null);
    } catch (e: any) {
      throw e;
    }
  }, []);

  const clear = useCallback(() => {
    clearScanResult();
    setStatus('idle');
    setError(null);
    setLastBase64(null);
  }, []);

  return { status, error, capture, pickImage, retry, confirm, clear };
}
