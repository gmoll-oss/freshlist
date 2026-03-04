import type { ScanResult, PantryItem, OCRProduct } from '../../types';

let _scanResult: ScanResult | null = null;

export function setScanResult(result: ScanResult): void {
  _scanResult = result;
}

export function getScanResult(): ScanResult | null {
  return _scanResult;
}

export function clearScanResult(): void {
  _scanResult = null;
}

// Rescan results
export interface RescanResultData {
  stillPresent: string[];
  consumed: string[];
  newItems: OCRProduct[];
  pantryItems: PantryItem[];
}

let _rescanResult: RescanResultData | null = null;

export function setRescanResult(result: RescanResultData): void {
  _rescanResult = result;
}

export function getRescanResult(): RescanResultData | null {
  return _rescanResult;
}

export function clearRescanResult(): void {
  _rescanResult = null;
}
