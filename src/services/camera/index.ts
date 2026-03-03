import * as ImagePicker from 'expo-image-picker';
import { Platform, Alert } from 'react-native';

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
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return null;

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
