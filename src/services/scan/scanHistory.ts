import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'scan_history';
const MAX_ENTRIES = 50;

export interface ScanHistoryEntry {
  id: string;
  date: string; // ISO
  mode: 'ticket' | 'fridge';
  store?: string;
  itemCount: number;
  itemNames: string[];
}

export async function addScanToHistory(entry: Omit<ScanHistoryEntry, 'id' | 'date'>): Promise<void> {
  const history = await getScanHistory();
  const newEntry: ScanHistoryEntry = {
    ...entry,
    id: `scan-${Date.now()}`,
    date: new Date().toISOString(),
  };
  const updated = [newEntry, ...history].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function getScanHistory(): Promise<ScanHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function clearScanHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
