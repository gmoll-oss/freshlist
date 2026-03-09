import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Leaf, ScanLine, Sparkles, ChefHat } from 'lucide-react-native';
import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

const FEATURES = [
  { Icon: ScanLine, text: 'Escanea tu ticket y llena tu despensa' },
  { Icon: Sparkles, text: 'IA que planifica tus comidas' },
  { Icon: ChefHat, text: 'Cocina sin desperdiciar nada' },
];

export default function LoginScreen() {
  const { signInWithGoogle, signInWithApple, signInWithEmail, skipAuth } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message ?? 'Error al iniciar sesión con Google');
    } finally {
      setBusy(false);
    }
  }

  async function handleApple() {
    setBusy(true);
    setError(null);
    try {
      await signInWithApple();
    } catch (e: any) {
      setError(e.message ?? 'Error al iniciar sesión con Apple');
    } finally {
      setBusy(false);
    }
  }

  async function handleEmail() {
    if (!email || !password) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
    } catch (e: any) {
      setError(e.message ?? 'Error al iniciar sesión');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={s.logoBox}>
          <View style={s.logoCircle}>
            <Leaf size={44} color={colors.green600} strokeWidth={1.8} />
          </View>
          <Text style={s.brand}>FreshList</Text>
          <Text style={s.tagline}>Tu despensa inteligente</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={s.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <View style={s.featureIcon}>
                <f.Icon size={16} color={colors.green600} strokeWidth={2} />
              </View>
              <Text style={s.featureText}>{f.text}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={s.buttons}>
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={s.input}
            placeholder="Contraseña"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={s.emailBtn} onPress={handleEmail} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={s.emailText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>o</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} disabled={busy}>
            <Text style={s.googleText}>Continuar con Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity style={s.appleBtn} onPress={handleApple} disabled={busy}>
              <Text style={s.appleText}>Continuar con Apple</Text>
            </TouchableOpacity>
          )}

          {error && <Text style={s.error}>{error}</Text>}
        </Animated.View>

        <TouchableOpacity onPress={skipAuth} style={s.skipBtn}>
          <Text style={s.skipText}>Continuar sin cuenta</Text>
        </TouchableOpacity>

        <Text style={s.footer}>
          Al continuar, aceptas nuestros términos de uso
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  logoBox: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 88, height: 88, borderRadius: 28, backgroundColor: colors.green50,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.green200,
  },
  brand: { fontSize: 34, fontFamily: fonts.black, color: colors.text, marginTop: 12 },
  tagline: { fontSize: 14, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 4 },
  features: { width: '100%', gap: 8, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: colors.green50,
    justifyContent: 'center', alignItems: 'center',
  },
  featureText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSec },
  buttons: { width: '100%', gap: 10 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 14, fontFamily: fonts.regular, color: colors.text,
  },
  emailBtn: { backgroundColor: colors.green600, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' },
  emailText: { fontSize: 15, fontFamily: fonts.bold, color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textMuted },
  googleBtn: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: 16, alignItems: 'center',
  },
  googleText: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  appleBtn: { backgroundColor: '#000', borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' },
  appleText: { fontSize: 15, fontFamily: fonts.bold, color: '#fff' },
  error: { fontSize: 12, fontFamily: fonts.regular, color: colors.red500, textAlign: 'center', marginTop: spacing.sm },
  skipBtn: { marginTop: 20 },
  skipText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSec, textDecorationLine: 'underline' },
  footer: { fontSize: 11, fontFamily: fonts.regular, color: colors.textDim, textAlign: 'center', marginTop: 20 },
});
