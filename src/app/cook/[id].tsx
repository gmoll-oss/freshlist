import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ChefHat, ChevronLeft, Check, Flame, Leaf, CookingPot, UtensilsCrossed, Timer, Volume2, X } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

const STEPS = [
  { text: 'Corta la pechuga en tiras finas', Icon: UtensilsCrossed, timer: 0 },
  { text: 'Calienta aceite en el wok a fuego alto', Icon: CookingPot, timer: 0 },
  { text: 'Saltea el pollo 4 min hasta dorado', Icon: Flame, timer: 240 },
  { text: 'Añade espinacas y salsa thai', Icon: Leaf, timer: 0 },
  { text: 'Cocina 2 min más y sirve', Icon: UtensilsCrossed, timer: 120 },
];

export default function CookScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const current = STEPS[step];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.lg, flex: 1 }}>
        {/* Close */}
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <X size={20} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>

        {/* Title */}
        <View style={s.titleRow}>
          <ChefHat size={15} color={colors.green600} strokeWidth={2.2} />
          <Text style={s.modeLabel}>MODO COCINA</Text>
        </View>
        <Text style={s.title}>Pollo Thai con Espinacas</Text>

        {/* Progress dots */}
        <View style={s.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[s.dot, i <= step && s.dotActive, i === step && s.dotCurrent]} />
          ))}
        </View>

        {/* Step card */}
        <View style={s.stepCard}>
          <View style={s.stepIconBox}>
            <current.Icon size={36} color={colors.green600} strokeWidth={1.5} />
          </View>
          <Text style={s.stepNum}>PASO {step + 1} DE {STEPS.length}</Text>
          <Text style={s.stepText}>{current.text}</Text>
        </View>

        {/* Timer */}
        {current.timer > 0 && (
          <View style={s.timerCard}>
            <Timer size={18} color={colors.orange500} strokeWidth={2.2} />
            <Text style={s.timerValue}>{Math.floor(current.timer / 60)}:{String(current.timer % 60).padStart(2, '0')}</Text>
            <Text style={s.timerLabel}>Temporizador</Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        {/* Navigation */}
        <View style={s.navRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => setStep(Math.max(0, step - 1))}>
            <ChevronLeft size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.nextBtn, step === STEPS.length - 1 && s.doneBtn]}
            onPress={() => step === STEPS.length - 1 ? router.back() : setStep(step + 1)}>
            {step === STEPS.length - 1 && <Check size={18} color="white" strokeWidth={2.5} />}
            <Text style={[s.nextText, step === STEPS.length - 1 && { color: 'white' }]}>
              {step === STEPS.length - 1 ? 'Hecho' : 'Siguiente'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.voiceHint}>
          <Volume2 size={13} color={colors.violet400} strokeWidth={2} />
          <Text style={s.voiceText}>Di "siguiente" o "temporizador"</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  closeBtn: { alignSelf: 'flex-end', padding: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 },
  modeLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.green600, letterSpacing: 0.8 },
  title: { fontSize: 20, fontFamily: fonts.black, color: colors.text, textAlign: 'center', marginBottom: 20 },
  dots: { flexDirection: 'row', gap: 4, justifyContent: 'center', marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surfaceHover },
  dotActive: { backgroundColor: colors.green500 },
  dotCurrent: { width: 24 },
  stepCard: { backgroundColor: colors.card, borderRadius: 28, padding: 32, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 16 },
  stepIconBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.green50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  stepNum: { fontSize: 10, fontFamily: fonts.bold, color: colors.green600, letterSpacing: 1, marginBottom: 8 },
  stepText: { fontSize: 20, fontFamily: fonts.bold, color: colors.text, lineHeight: 28, textAlign: 'center' },
  timerCard: { backgroundColor: colors.orange50, borderRadius: radius.lg, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.orange100, marginBottom: 16 },
  timerValue: { fontSize: 32, fontFamily: fonts.black, color: colors.orange500, marginTop: 4 },
  timerLabel: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 2 },
  navRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  backBtn: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  nextBtn: { flex: 1, height: 52, borderRadius: radius.lg, backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  doneBtn: { backgroundColor: colors.green600 },
  nextText: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  voiceHint: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  voiceText: { fontSize: 11, color: colors.violet400, fontFamily: fonts.medium },
});
