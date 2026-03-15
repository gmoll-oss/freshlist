import { useEffect } from 'react';
import { Platform } from 'react-native';
import { initNotifications } from '../services/notifications';

const Notifications = Platform.OS !== 'web' ? require('expo-notifications') : null;

/**
 * Hook that initializes notification permissions and schedules on mount.
 * Also sets up a listener for incoming notifications.
 */
export function useNotifications() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    initNotifications().catch(() => {
      // Permissions denied or other error — silently ignore
    });

    // Listen for notifications received while app is in foreground
    const subscription = Notifications.addNotificationReceivedListener(() => {
      // No-op for now; could update UI in the future
    });

    return () => subscription.remove();
  }, []);
}
