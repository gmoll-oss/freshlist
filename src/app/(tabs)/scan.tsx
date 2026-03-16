import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, TextInput } from 'react-native';
import { Alert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, Receipt, Sparkles, Image, RefreshCw, Barcode, X, Upload } from 'lucide-react-native';
import { CameraView } from 'expo-camera';
import Haptics from '../../utils/haptics';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useScan } from '../../hooks/useScan';
import { fetchPantryItems } from '../../services/supabase/pantry';
import { lookupBarcode } from '../../services/barcode/barcodeService';

type ScanMode = 'ticket' | 'fridge' | 'barcode';

export default function ScanScreen() {
  const { initialMode } = useLocalSearchParams<{ initialMode?: ScanMode }>();
  const [mode, setMode] = useState<ScanMode>(initialMode ?? 'ticket');
  const [barcodeActive, setBarcodeActive] = useState(false);
  const [barcodeProcessing, setBarcodeProcessing] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [webBarcodeInput, setWebBarcodeInput] = useState('');
  const scan = useScan();
  const router = useRouter();

  const handleWebBarcodeSubmit = useCallback(async () => {
    const code = webBarcodeInput.trim();
    if (!code || barcodeProcessing) return;
    setBarcodeProcessing(true);
    try {
      const product = await lookupBarcode(code);
      if (product) {
        scan.setBarcodeResult(product);
        router.push('/products');
      } else {
        Alert.alert(
          'Producto no encontrado',
          `Codigo: ${code}\nNo encontramos este producto en nuestra base de datos. Puedes anadirlo manualmente.`,
          [
            { text: 'Anadir manual', onPress: () => router.push('/products') },
            { text: 'Intentar otro', onPress: () => setWebBarcodeInput('') },
          ],
        );
      }
    } catch {
      Alert.alert('Error', 'No se pudo buscar el producto');
    } finally {
      setBarcodeProcessing(false);
    }
  }, [webBarcodeInput, barcodeProcessing, scan, router]);

  const handleBarcodeScanned = useCallback(async ({ data, type }: { data: string; type: string }) => {
    if (barcodeProcessing || data === lastScannedCode) return;
    setBarcodeProcessing(true);
    setLastScannedCode(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const product = await lookupBarcode(data);
      if (product) {
        setBarcodeActive(false);
        // Push to products screen with the barcode result
        scan.setBarcodeResult(product);
        router.push('/products');
      } else {
        Alert.alert(
          'Producto no encontrado',
          `Codigo: ${data}\nNo encontramos este producto en nuestra base de datos. Puedes anadirlo manualmente.`,
          [
            { text: 'Anadir manual', onPress: () => { setBarcodeActive(false); router.push('/products'); } },
            { text: 'Seguir escaneando', onPress: () => { setLastScannedCode(''); setBarcodeProcessing(false); } },
          ],
        );
      }
    } catch {
      Alert.alert('Error', 'No se pudo buscar el producto');
    } finally {
      setBarcodeProcessing(false);
    }
  }, [barcodeProcessing, lastScannedCode, scan, router]);

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
    if (mode === 'barcode') return; // barcode has its own flow
    const result = await scan.retry(mode);
    if (result) router.push('/products');
  }

  const isWorking = scan.status === 'capturing' || scan.status === 'processing';

  const viewfinderText = mode === 'ticket'
    ? 'Encuadra el ticket completo'
    : mode === 'fridge'
    ? 'Foto de tu nevera abierta'
    : 'Apunta al codigo de barras';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.lg }}>
        <Text style={s.title}>Escanear</Text>
        <Text style={s.subtitle}>Elige que quieres escanear</Text>

        <View style={s.toggle}>
          {([
            { key: 'ticket' as ScanMode, icon: Receipt, label: 'Ticket' },
            { key: 'fridge' as ScanMode, icon: Camera, label: 'Nevera' },
            { key: 'barcode' as ScanMode, icon: Barcode, label: 'Producto' },
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
        {Platform.OS === 'web' ? (
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
              <View style={s.webUploadArea}>
                {mode === 'barcode'
                  ? <Barcode size={32} color={colors.green400} strokeWidth={1.8} />
                  : <Upload size={32} color={colors.green400} strokeWidth={1.8} />
                }
                <Text style={s.webUploadTitle}>
                  {mode === 'ticket' ? 'Sube una foto del ticket' : mode === 'fridge' ? 'Sube una foto de tu nevera' : 'Escanea un codigo de barras'}
                </Text>
                <TouchableOpacity style={s.webUploadBtn} onPress={handleCapture} disabled={isWorking}>
                  <Camera size={18} color="white" strokeWidth={2} />
                  <Text style={s.webUploadBtnText}>Tomar foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.webUploadBtn, { backgroundColor: colors.surface }]} onPress={handleGallery} disabled={isWorking}>
                  <Image size={18} color={colors.textSec} strokeWidth={2} />
                  <Text style={[s.webUploadBtnText, { color: colors.textSec }]}>Elegir de galeria</Text>
                </TouchableOpacity>
                {mode === 'barcode' && (
                  <View style={s.webBarcodeRow}>
                    <TextInput
                      style={s.webBarcodeInput}
                      placeholder="O escribe el codigo de barras..."
                      placeholderTextColor={colors.textMuted}
                      value={webBarcodeInput}
                      onChangeText={setWebBarcodeInput}
                      onSubmitEditing={handleWebBarcodeSubmit}
                      keyboardType="numeric"
                      returnKeyType="search"
                    />
                    <TouchableOpacity
                      style={[s.webBarcodeSubmit, !webBarcodeInput.trim() && { opacity: 0.5 }]}
                      onPress={handleWebBarcodeSubmit}
                      disabled={!webBarcodeInput.trim() || barcodeProcessing}
                    >
                      {barcodeProcessing
                        ? <ActivityIndicator size="small" color="white" />
                        : <Text style={s.webBarcodeSubmitText}>Buscar</Text>
                      }
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : mode === 'barcode' && barcodeActive ? (
          <View style={s.camera}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
            {barcodeProcessing && (
              <View style={[s.processingBox, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.green400} />
                <Text style={s.processingText}>Buscando producto...</Text>
              </View>
            )}
          </View>
        ) : (
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
                {mode === 'barcode'
                  ? <Barcode size={28} color={colors.green400} style={{ opacity: 0.7 }} strokeWidth={1.8} />
                  : <Camera size={28} color={colors.green400} style={{ opacity: 0.7 }} strokeWidth={1.8} />
                }
                <Text style={s.viewfinderText}>{viewfinderText}</Text>
              </View>
            )}
          </View>
        )}

        {/* Capture + Gallery (native only) */}
        {Platform.OS !== 'web' && (
          mode === 'barcode' ? (
            <View style={s.captureRow}>
              <TouchableOpacity
                style={[s.captureOuter, barcodeActive && { borderColor: colors.red400 }]}
                onPress={() => { setBarcodeActive(!barcodeActive); setLastScannedCode(''); }}
              >
                <View style={[s.captureInner, barcodeActive && { backgroundColor: colors.red400 }]}>
                  {barcodeActive
                    ? <X size={24} color="white" strokeWidth={2.5} />
                    : <Barcode size={24} color="white" strokeWidth={2} />
                  }
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.captureRow}>
              <TouchableOpacity style={s.galleryBtn} onPress={handleGallery} disabled={isWorking}>
                <Image size={22} color={colors.textSec} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity style={s.captureOuter} onPress={handleCapture} disabled={isWorking}>
                <View style={[s.captureInner, isWorking && { opacity: 0.4 }]} />
              </TouchableOpacity>
              <View style={{ width: 44 }} />
            </View>
          )
        )}

        {/* Tips */}
        <View style={s.tipsCard}>
          <View style={s.tipsHeader}>
            <Sparkles size={13} color={colors.green600} strokeWidth={2.2} />
            <Text style={s.tipsTitle}>Tips para mejor resultado</Text>
          </View>
          {(mode === 'ticket'
            ? ['Ticket completo en la foto', 'Buena iluminacion, sin sombras', 'Superficie plana, sin arrugas']
            : mode === 'fridge'
            ? ['Abre la nevera entera', 'Buena luz, sin reflejos', 'Incluye todos los estantes']
            : ['Acerca el codigo de barras a la camara', 'Funciona con EAN-13, EAN-8 y UPC', 'Si no lo encuentra, anadelo manualmente']
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
  captureInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.green500, justifyContent: 'center', alignItems: 'center' },
  tipsCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tipsTitle: { fontSize: 12, fontFamily: fonts.medium, color: colors.textSec },
  tip: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 3 },
  webUploadArea: { alignItems: 'center', justifyContent: 'center', gap: 12, flex: 1 },
  webUploadTitle: { fontSize: 14, fontFamily: fonts.medium, color: colors.textSec, textAlign: 'center' },
  webUploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.green600, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: radius.md,
  },
  webUploadBtnText: { fontSize: 14, fontFamily: fonts.bold, color: 'white' },
  webBarcodeRow: { flexDirection: 'row', gap: 8, width: '100%', paddingHorizontal: 16, marginTop: 4 },
  webBarcodeInput: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, fontFamily: fonts.regular, color: colors.text,
    borderWidth: 1, borderColor: colors.border,
  },
  webBarcodeSubmit: {
    backgroundColor: colors.green600, borderRadius: radius.md,
    paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center',
  },
  webBarcodeSubmitText: { fontSize: 13, fontFamily: fonts.bold, color: 'white' },
});
