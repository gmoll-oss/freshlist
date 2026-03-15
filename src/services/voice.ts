// Voice service stub
// Speech-to-text requires expo-speech-recognition or a native module.
// For now, we provide the interface and a fallback alert.
// When a speech recognition package is installed, implement startListening/stopListening here.

import { Platform } from 'react-native';
import { Alert } from '../utils/alert';

let isListening = false;

export function isVoiceAvailable(): boolean {
  // Will be true once a speech recognition package is integrated
  return false;
}

export async function startListening(): Promise<string> {
  if (!isVoiceAvailable()) {
    Alert.alert(
      'Voz no disponible',
      'La entrada por voz requiere un modulo nativo. Escribe el texto manualmente.',
    );
    return '';
  }
  // Placeholder for future implementation
  isListening = true;
  return '';
}

export function stopListening(): void {
  isListening = false;
}

export function getIsListening(): boolean {
  return isListening;
}
