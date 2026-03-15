import { Alert as RNAlert, Platform } from 'react-native';

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export const Alert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}${message ? '\n' + message : ''}`);
        if (confirmed) {
          const actionBtn = buttons.find(b => b.style !== 'cancel');
          actionBtn?.onPress?.();
        } else {
          const cancelBtn = buttons.find(b => b.style === 'cancel');
          cancelBtn?.onPress?.();
        }
      } else {
        window.alert(`${title}${message ? '\n' + message : ''}`);
        buttons?.[0]?.onPress?.();
      }
    } else {
      RNAlert.alert(title, message, buttons as any);
    }
  },
};
