import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Camera, Receipt, Sparkles, Image, RefreshCw } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useScan } from '../../hooks/useScan';
import { fetchPantryItems } from '../../services/supabase/pantry';

type ScanMode = 'ticket' | 'fridge';

export default function ScanScreen() {
  const [mode, setMode] = useState<ScanMode>('ticket');
  const scan = useScan();
  const router = useRouter();

  /** After capturing a fridge photo, check if user wants to update inventory or add new */
  async function handleFridgeResult(base64: string) {
    // Check if user has existing pantry items
    let pantryCount = 0;
    try {
      const items = await fetchPantryItems();
      pantryCount = items.filter((i) => i.status === 'fresh' || i.status === 'expiring').length;
    } catch {}

    if (pantryCount > 0) {
      // User has items — ask what they want to do
      Alert.alert(
        'Tienes ' + pantryCount + ' productos registrados',
        'Que quieres hacer con esta foto?',
        [
          {
            text: 'Actualizar inventario',
            onPress: async () => {
              const ok = await scan.processRescan(base64);
              if (ok) router.push('/rescan-results');
            },
          },
          {
            text: 'Anadir nuevos',
            onPress: async () => {
              const result = await scan.processImage(base64, 'fridge');
              if (result) router.push('/products');
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ],
      );
    } else {
      // No items — normal scan
      const result = await scan.processImage(base64, 'fridge');
      if (result) router.push('/products');
    }
  }

  async function handleCapture() {
    if (mode === 'ticket') {
      const result = await scan.capture('ticket');
      if (result) router.push('/products');
    } else {
      // Fridge: capture first, then decide
      const base64 = await scan.captureBase64();
      if (!base64) return;
      await handleFridgeResult(base64);
    }
  }

  async function handleGallery() {
    if (mode === 'ticket') {
      const result = await scan.pickImage('ticket');
      if (result) router.push('/products');
    } else {
      const base64 = await scan.pickBase64();
      if (!base64) return;
      await handleFridgeResult(base64);
    }
  }

  async function handleRetry() {
    const result = await scan.retry(mode);
    if (result) router.push('/products');
  }

  const isWorking = scan.status === 'capturing' || scan.status === 'processing';

  const viewfinderText = mode === 'ticket'
    ? 'Encuadra el ticket completo'
    : 'Foto de tu nevera abierta';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.lg }}>
        <Text style={s.title}>Escanear</Text>
        <Text style={s.subtitle}>Elige que quieres escanear</Text>

        <View style={s.toggle}>
          {([
            { key: 'ticket' as ScanMode, icon: Receipt, label: 'Ticket' },
            { key: 'fridge' as ScanMode, icon: Camera, label: 'Nevera / Despensa' },
          ]).map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[s.toggleBtn, mode === m.key && s.toggleActive]}
              onPress={() => setMode(m.key)}
              disabled={isWorking}
            >
              <m.icon size={15} color={mode === m.key ? 'white' : colors.textSec} strokeWidth={2.2} />
              <Text style={[s.toggleText, mode === m.key && s.toggleTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Camera area */}
        <View style={s.camera}>
          {scan.status === 'processing' ? (
            <View style={s.processingBox}>
              <ActivityIndicator size="large" color={colors.green400} />
              <Text style={s.processingText}>Analizando imagen...</Text>
            </View>
          ) : scan.status === 'error' ? (
            <View style={s.processingBox}>
              <Text style={s.errorText}>{scan.error}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={handleRetry}>
                <RefreshCw size={16} color="white" strokeWidth={2.2} />
                <Text style={s.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.viewfinder}>
              <Camera size={28} color={colors.green400} style={{ opacity: 0.7 }} strokeWidth={1.8} />
              <Text style={s.viewfinderText}>{viewfinderText}</Text>
            </View>
          )}
        </View>

        {/* Capture + Gallery */}
        <View style={s.captureRow}>
          <TouchableOpacity style={s.galleryBtn} onPress={handleGallery} disabled={isWorking}>
            <Image size={22} color={colors.textSec} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={s.captureOuter} onPress={handleCapture} disabled={isWorking}>
            <View style={[s.captureInner, isWorking && { opacity: 0.4 }]} />
          </TouchableOpacity>
          <View style={{ width: 44 }} />
        </View>

        {/* Tips */}
        <View style={s.tipsCard}>
          <View style={s.tipsHeader}>
            <Sparkles size={13} color={colors.green600} strokeWidth={2.2} />
            <Text style={s.tipsTitle}>Tips para mejor resultado</Text>
          </View>
          {(mode === 'ticket'
            ? ['Ticket completo en la foto', 'Buena iluminacion, sin sombras', 'Superficie plana, sin arrugas']
            : ['Abre la nevera entera', 'Buena luz, sin reflejos', 'Incluye todos los estantes']
          ).map((t, i) => (
            <Text key={i} style={s.tip}>• {t}</Text>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 20, fontFamily: fonts.black, color: colors.text, textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.regular, textAlign: 'center', marginBottom: 16 },
  toggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  toggleBtn: {
    flex: 1, paddingVertical: 11, borderRadius: radius.md, backgroundColor: colors.surface,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  toggleActive: { backgroundColor: colors.green600 },
  toggleText: { fontSize: 13, fontFamily: fonts.bold, color: colors.textSec },
  toggleTextActive: { color: 'white' },
  camera: {
    backgroundColor: '#1C1917', borderRadius: 24, height: 260,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  viewfinder: {
    width: 200, height: 140, borderWidth: 2, borderColor: colors.green400,
    borderStyle: 'dashed', borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  viewfinderText: { fontSize: 11, color: colors.green400, opacity: 0.8, fontFamily: fonts.regular },
  processingBox: { alignItems: 'center', gap: 12 },
  processingText: { fontSize: 13, color: colors.green400, fontFamily: fonts.medium },
  errorText: { fontSize: 12, color: colors.red400, fontFamily: fonts.regular, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.green600,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md, marginTop: 4,
  },
  retryText: { fontSize: 13, fontFamily: fonts.bold, color: 'white' },
  captureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 16 },
  galleryBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  captureOuter: {
    width: 68, height: 68, borderRadius: 34, borderWidth: 4, borderColor: colors.green500,
    justifyContent: 'center', alignItems: 'center',
  },
  captureInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.green500 },
  tipsCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tipsTitle: { fontSize: 12, fontFamily: fonts.medium, color: colors.textSec },
  tip: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 3 },
});
