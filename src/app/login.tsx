import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Leaf } from 'lucide-react-native';
import { useState } from 'react';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

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
        <View style={s.logoBox}>
          <Leaf size={40} color={colors.green600} strokeWidth={2} />
          <Text style={s.brand}>FreshList</Text>
          <Text style={s.tagline}>Tu despensa inteligente</Text>
        </View>

        <View style={s.buttons}>
          {/* Email/password */}
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

          {/* OAuth */}
          <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} disabled={busy}>
            <Text style={s.googleText}>Continuar con Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity style={s.appleBtn} onPress={handleApple} disabled={busy}>
              <Text style={s.appleText}>Continuar con Apple</Text>
            </TouchableOpacity>
          )}

          {error && <Text style={s.error}>{error}</Text>}
        </View>

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
  logoBox: { alignItems: 'center', marginBottom: 40 },
  brand: {
    fontSize: 32,
    fontFamily: fonts.black,
    color: colors.text,
    marginTop: spacing.md,
  },
  tagline: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  buttons: { width: '100%', gap: 10 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  emailBtn: {
    backgroundColor: colors.green600,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  emailText: { fontSize: 15, fontFamily: fonts.bold, color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textMuted },
  googleBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  googleText: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  appleBtn: {
    backgroundColor: '#000',
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  appleText: { fontSize: 15, fontFamily: fonts.bold, color: '#fff' },
  error: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.red500,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  skipBtn: { marginTop: 20 },
  skipText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSec,
    textDecorationLine: 'underline',
  },
  footer: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 20,
  },
});
