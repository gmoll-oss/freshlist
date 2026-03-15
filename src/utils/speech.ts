import { Platform } from 'react-native';

let Speech: any;

if (Platform.OS !== 'web') {
  Speech = require('expo-speech');
}

interface SpeakOptions {
  language?: string;
  rate?: number;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: () => void;
}

export function speak(text: string, options?: SpeakOptions) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.language ?? 'es-ES';
      utterance.rate = options?.rate ?? 1;
      utterance.onend = () => options?.onDone?.();
      utterance.onerror = () => options?.onError?.();
      window.speechSynthesis.speak(utterance);
    }
  } else {
    Speech.speak(text, options);
  }
}

export function stop() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } else {
    Speech.stop();
  }
}

export async function isSpeakingAsync(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && window.speechSynthesis?.speaking || false;
  }
  return Speech.isSpeakingAsync();
}
