import { useState, useCallback } from 'react';
import { capturePhoto, pickFromGallery } from '../services/camera';
import { scanTicket, scanFridge, rescanFridge } from '../services/ai/ocr';
import { setScanResult, clearScanResult, setRescanResult } from '../services/scan/scanStore';
import { insertPantryItems, fetchPantryItems } from '../services/supabase/pantry';
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

  const processRescan = useCallback(async (base64: string) => {
    setStatus('processing');
    setError(null);
    try {
      const pantryItems = await fetchPantryItems();
      const activeItems = pantryItems.filter((i) => i.status === 'fresh' || i.status === 'expiring');

      if (activeItems.length === 0) {
        setError('No tienes productos activos para comparar. Usa el escaneo normal.');
        setStatus('error');
        return false;
      }

      const result = await rescanFridge(base64, activeItems);
      setRescanResult({
        stillPresent: result.still_present ?? [],
        consumed: result.consumed ?? [],
        newItems: result.new_items ?? [],
        pantryItems: activeItems,
      });
      setStatus('done');
      return true;
    } catch (e: any) {
      setError(e.message ?? 'Error al comparar inventario');
      setStatus('error');
      return false;
    }
  }, []);

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

  const rescan = useCallback(async () => {
    setStatus('capturing');
    setError(null);
    const base64 = await capturePhoto();
    if (!base64) {
      setStatus('idle');
      return false;
    }
    setLastBase64(base64);
    return processRescan(base64);
  }, [processRescan]);

  const rescanFromGallery = useCallback(async () => {
    setStatus('capturing');
    setError(null);
    const base64 = await pickFromGallery();
    if (!base64) {
      setStatus('idle');
      return false;
    }
    setLastBase64(base64);
    return processRescan(base64);
  }, [processRescan]);

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

  return { status, error, capture, pickImage, rescan, rescanFromGallery, retry, confirm, clear };
}
