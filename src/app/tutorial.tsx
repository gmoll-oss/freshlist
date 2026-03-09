import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScanLine, Sparkles, ChefHat, ArrowRight } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { savePreferences } from '../services/supabase/preferences';

const STEPS = [
  {
    Icon: ScanLine,
    title: 'Escanea tu ticket o nevera',
    subtitle: 'Detectamos todos tus productos automaticamente',
    color: colors.green600,
    bg: colors.green50,
  },
  {
    Icon: Sparkles,
    title: 'Te planificamos la semana',
    subtitle: 'Menu personalizado basado en lo que tienes',
    color: colors.violet400,
    bg: colors.violet50,
  },
  {
    Icon: ChefHat,
    title: 'Cocina sin pensar',
    subtitle: 'Recetas paso a paso con timer integrado',
    color: colors.orange500,
    bg: colors.orange50,
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function handleNext() {
    if (isLast) {
      await savePreferences({ tutorial_done: true } as any).catch(() => {});
      router.replace('/(tabs)');
    } else {
      setStep(step + 1);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.content}>
        <View style={[s.iconWrap, { backgroundColor: current.bg }]}>
          <current.Icon size={56} color={current.color} strokeWidth={1.5} />
        </View>

        <Text style={s.title}>{current.title}</Text>
        <Text style={s.subtitle}>{current.subtitle}</Text>

        <View style={{ flex: 1 }} />

        {/* Dots */}
        <View style={s.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[s.dot, i === step && s.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
          <Text style={s.nextText}>{isLast ? 'Empezar' : 'Siguiente'}</Text>
          <ArrowRight size={16} color="white" strokeWidth={2.5} />
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity style={s.skipBtn} onPress={async () => {
            await savePreferences({ tutorial_done: true } as any).catch(() => {});
            router.replace('/(tabs)');
          }}>
            <Text style={s.skipText}>Saltar</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', padding: spacing.lg, paddingTop: 80 },
  iconWrap: {
    width: 120, height: 120, borderRadius: 60,
    justifyContent: 'center', alignItems: 'center', marginBottom: 32,
  },
  title: { fontSize: 24, fontFamily: fonts.black, color: colors.text, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, fontFamily: fonts.regular, color: colors.textSec, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surfaceHover },
  dotActive: { width: 24, backgroundColor: colors.green500 },
  nextBtn: {
    backgroundColor: colors.green600, borderRadius: radius.lg, paddingVertical: 18,
    paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 10,
    width: '100%', justifyContent: 'center',
  },
  nextText: { fontSize: 16, fontFamily: fonts.bold, color: 'white' },
  skipBtn: { paddingVertical: 16 },
  skipText: { fontSize: 14, fontFamily: fonts.medium, color: colors.textMuted },
});
