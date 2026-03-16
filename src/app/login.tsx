import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Leaf } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSubmit() {
    if (!email || !password) return;
    if (isSignUp && !name.trim()) {
      setError('Introduce tu nombre');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name.trim());
      } else {
        await signInWithEmail(email, password);
      }
    } catch (e: any) {
      setError(e.message ?? (isSignUp ? 'Error al crear cuenta' : 'Error al iniciar sesión'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={s.logoBox}>
          <View style={s.logoCircle}>
            <Leaf size={44} color={colors.green600} strokeWidth={1.8} />
          </View>
          <Text style={s.brand}>FreshList</Text>
          <Text style={s.tagline}>Tu despensa inteligente</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={s.buttons}>
          <Text style={s.formTitle}>{isSignUp ? 'Crear cuenta' : 'Iniciar sesion'}</Text>

          {isSignUp && (
            <TextInput
              style={s.input}
              placeholder="Tu nombre"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}
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
          <TouchableOpacity style={s.emailBtn} onPress={handleSubmit} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={s.emailText}>{isSignUp ? 'Crear cuenta' : 'Iniciar sesion'}</Text>
            )}
          </TouchableOpacity>

          {error && <Text style={s.error}>{error}</Text>}

          <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setError(null); }} style={s.toggleBtn}>
            <Text style={s.toggleText}>
              {isSignUp ? 'Ya tengo cuenta — Iniciar sesion' : 'No tengo cuenta — Crear una'}
            </Text>
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>proximamente</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={[s.socialBtn, s.socialDisabled]} disabled>
            <Text style={s.socialText}>Continuar con Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity style={[s.appleBtn, s.socialDisabled]} disabled>
              <Text style={s.appleText}>Continuar con Apple</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Text style={s.footer}>
          Al continuar, aceptas nuestros términos de uso
        </Text>
      </ScrollView>
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
  buttons: { width: '100%', gap: 12, marginTop: 20 },
  formTitle: { fontSize: 20, fontFamily: fonts.bold, color: colors.text, textAlign: 'center', marginBottom: 4 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 15, fontFamily: fonts.regular, color: colors.text,
  },
  emailBtn: { backgroundColor: colors.green600, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  emailText: { fontSize: 16, fontFamily: fonts.bold, color: '#fff' },
  error: { fontSize: 12, fontFamily: fonts.medium, color: colors.red500, textAlign: 'center', marginTop: spacing.sm },
  toggleBtn: { alignItems: 'center', marginTop: 8 },
  toggleText: { fontSize: 14, fontFamily: fonts.medium, color: colors.green600 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 11, fontFamily: fonts.regular, color: colors.textDim },
  socialBtn: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: 16, alignItems: 'center',
  },
  socialText: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  appleBtn: { backgroundColor: '#000', borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' },
  appleText: { fontSize: 15, fontFamily: fonts.bold, color: '#fff' },
  socialDisabled: { opacity: 0.35 },
  footer: { fontSize: 11, fontFamily: fonts.regular, color: colors.textDim, textAlign: 'center', marginTop: 24, marginBottom: 20 },
});
