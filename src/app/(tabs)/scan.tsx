import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Camera, Receipt, Sparkles, Image, RefreshCw } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useScan } from '../../hooks/useScan';

export default function ScanScreen() {
  const [mode, setMode] = useState<'ticket' | 'fridge'>('ticket');
  const scan = useScan();
  const router = useRouter();

  async function handleCapture() {
    const result = await scan.capture(mode);
    if (result) router.push('/products');
  }

  async function handleGallery() {
    const result = await scan.pickImage(mode);
    if (result) router.push('/products');
  }

  async function handleRetry() {
    const result = await scan.retry(mode);
    if (result) router.push('/products');
  }

  const isWorking = scan.status === 'capturing' || scan.status === 'processing';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.lg }}>
        <Text style={s.title}>Escanear</Text>
        <Text style={s.subtitle}>Elige qué quieres escanear</Text>

        <View style={s.toggle}>
          {(['ticket', 'fridge'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[s.toggleBtn, mode === m && s.toggleActive]}
              onPress={() => setMode(m)}
              disabled={isWorking}
            >
              <Receipt size={16} color={mode === m ? 'white' : colors.textSec} strokeWidth={2.2} />
              <Text style={[s.toggleText, mode === m && s.toggleTextActive]}>
                {m === 'ticket' ? 'Ticket' : 'Nevera'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Camera area */}
        <View style={s.camera}>
          {scan.status === 'processing' ? (
            <View style={s.processingBox}>
              <ActivityIndicator size="large" color={colors.green400} />
              <Text style={s.processingText}>Analizando imagen…</Text>
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
              <Text style={s.viewfinderText}>
                {mode === 'ticket' ? 'Encuadra el ticket completo' : 'Foto de tu nevera abierta'}
              </Text>
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
          {['Ticket completo en la foto', 'Buena iluminación, sin sombras', 'Superficie plana, sin arrugas'].map(
            (t, i) => (
              <Text key={i} style={s.tip}>
                • {t}
              </Text>
            ),
          )}
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
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  toggleActive: { backgroundColor: colors.green600 },
  toggleText: { fontSize: 13, fontFamily: fonts.bold, color: colors.textSec },
  toggleTextActive: { color: 'white' },
  camera: {
    backgroundColor: '#1C1917',
    borderRadius: 24,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewfinder: {
    width: 200,
    height: 140,
    borderWidth: 2,
    borderColor: colors.green400,
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  viewfinderText: { fontSize: 11, color: colors.green400, opacity: 0.8, fontFamily: fonts.regular },
  processingBox: { alignItems: 'center', gap: 12 },
  processingText: { fontSize: 13, color: colors.green400, fontFamily: fonts.medium },
  errorText: { fontSize: 12, color: colors.red400, fontFamily: fonts.regular, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.green600,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },
  retryText: { fontSize: 13, fontFamily: fonts.bold, color: 'white' },
  captureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 16 },
  galleryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: colors.green500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.green500 },
  tipsCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tipsTitle: { fontSize: 12, fontFamily: fonts.medium, color: colors.textSec },
  tip: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 3 },
});
