import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { Alert } from '../../utils/alert';

async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permiso necesario',
      'Necesitamos acceso a la cámara para escanear tickets y fotos de tu nevera.',
    );
    return false;
  }
  return true;
}

export async function capturePhoto(): Promise<string | null> {
  // On web, skip native permission check — browser handles it via <input capture>
  if (Platform.OS !== 'web') {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return null;
  }

  if (Platform.OS === 'web') {
    // Use a direct <input capture="environment"> for reliable camera access on Android
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          // Strip the data:image/...;base64, prefix
          const base64 = dataUrl.split(',')[1] ?? null;
          resolve(base64);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };
      // If user cancels the file dialog
      window.addEventListener('focus', function onFocus() {
        window.removeEventListener('focus', onFocus);
        setTimeout(() => {
          if (!input.files?.length) resolve(null);
        }, 500);
      });
      input.click();
    });
  }

  const result = await ImagePicker.launchCameraAsync({
    base64: true,
    quality: 0.7,
    mediaTypes: ['images'],
  });

  if (result.canceled || !result.assets[0]?.base64) return null;
  return result.assets[0].base64;
}

export async function pickFromGallery(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    base64: true,
    quality: 0.7,
    mediaTypes: ['images'],
  });

  if (result.canceled || !result.assets[0]?.base64) return null;
  return result.assets[0].base64;
}
