import { Platform } from 'react-native';

const noopAsync = async () => {};

let HapticsModule: any;

if (Platform.OS !== 'web') {
  HapticsModule = require('expo-haptics');
} else {
  HapticsModule = {
    impactAsync: noopAsync,
    notificationAsync: noopAsync,
    selectionAsync: noopAsync,
    ImpactFeedbackStyle: { Light: 'LIGHT', Medium: 'MEDIUM', Heavy: 'HEAVY' },
    NotificationFeedbackType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
  };
}

export default HapticsModule;
export const { ImpactFeedbackStyle, NotificationFeedbackType } = HapticsModule;
