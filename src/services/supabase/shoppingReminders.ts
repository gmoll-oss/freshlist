import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ShoppingReminder } from '../../types';

const REMINDERS_KEY = 'shopping_reminders';

export async function getReminders(): Promise<ShoppingReminder[]> {
  const raw = await AsyncStorage.getItem(REMINDERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addReminder(name: string, note?: string): Promise<ShoppingReminder> {
  const reminders = await getReminders();
  const newReminder: ShoppingReminder = {
    id: `rem-${Date.now()}`,
    name: name.trim(),
    note: note?.trim(),
    created_at: new Date().toISOString(),
    completed: false,
  };
  const updated = [newReminder, ...reminders];
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
  return newReminder;
}

export async function toggleReminder(id: string): Promise<void> {
  const reminders = await getReminders();
  const updated = reminders.map((r) =>
    r.id === id ? { ...r, completed: !r.completed } : r,
  );
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
}

export async function deleteReminder(id: string): Promise<void> {
  const reminders = await getReminders();
  const updated = reminders.filter((r) => r.id !== id);
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
}

export async function clearCompletedReminders(): Promise<void> {
  const reminders = await getReminders();
  const updated = reminders.filter((r) => !r.completed);
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
}

/**
 * Move a reminder to the active shopping list (as a manual item).
 * Called when the user taps "Añadir a la lista" on a reminder.
 */
export async function moveReminderToList(id: string): Promise<string> {
  const reminders = await getReminders();
  const reminder = reminders.find((r) => r.id === id);
  if (!reminder) throw new Error('Reminder not found');
  // Mark as completed
  await toggleReminder(id);
  return reminder.name;
}
