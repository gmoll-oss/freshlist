import * as Notifications from 'expo-notifications';
import { fetchPantryItems } from './supabase/pantry';
import { getTodaysMeals } from './supabase/mealPlans';

// Configure how notifications are shown when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule daily 9:00 notification checking pantry items expiring today or tomorrow.
 */
export async function scheduleDailyExpiryCheck(): Promise<void> {
  // Cancel any previous expiry notifications
  await cancelNotificationsByTag('expiry-check');

  const items = await fetchPantryItems();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const expiring = items.filter(
    (i) =>
      (i.status === 'fresh' || i.status === 'expiring') &&
      (i.estimated_expiry === todayStr || i.estimated_expiry === tomorrowStr),
  );

  if (expiring.length === 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Productos por caducar',
      body: `Tienes ${expiring.length} producto${expiring.length > 1 ? 's' : ''} que caduca${expiring.length > 1 ? 'n' : ''} hoy o mañana`,
      data: { tag: 'expiry-check' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
}

/**
 * Schedule daily 21:00 notification if there's an uncooked meal plan for today.
 */
export async function scheduleNoCookReminder(): Promise<void> {
  // Cancel any previous cook reminders
  await cancelNotificationsByTag('cook-reminder');

  try {
    const todaysMeals = await getTodaysMeals();
    const uncookedMeals = todaysMeals.filter((m) => !m.cooked);

    if (uncookedMeals.length === 0) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍳 ¿Has cocinado hoy?',
        body: 'Si no, movemos el plan a otro día',
        data: { tag: 'cook-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 0,
      },
    });
  } catch {
    // Silently fail — no meal plans is fine
  }
}

/**
 * Cancel all scheduled notifications with a specific tag.
 */
async function cancelNotificationsByTag(tag: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.tag === tag) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

/**
 * Initialize all notification schedules.
 */
export async function initNotifications(): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  await scheduleDailyExpiryCheck();
  await scheduleNoCookReminder();
}
