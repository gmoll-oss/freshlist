import type { ScanResult } from '../../types';

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
