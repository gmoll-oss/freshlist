import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Alert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ChefHat, ChevronLeft, Check, Flame, Leaf, CookingPot, UtensilsCrossed, Timer, Volume2, VolumeX, X, Heart } from 'lucide-react-native';
import Haptics from '../../utils/haptics';
import { speak, stop } from '../../utils/speech';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { getCurrentMeal, clearCurrentMeal } from '../../services/mealPlan/mealPlanStore';
import { markMealCooked } from '../../services/supabase/mealPlans';
import { incrementCooked, incrementUsed } from '../../services/supabase/stats';
import { autoConsumePantryItems } from '../../services/supabase/pantry';
import { toggleFavorite, isFavorite, incrementTimesCooked } from '../../services/supabase/favorites';
import type { MealPlan } from '../../types';

const STEP_ICONS = [UtensilsCrossed, CookingPot, Flame, Leaf, UtensilsCrossed, CookingPot, Flame];

export default function CookScreen() {
  const [step, setStep] = useState(0);
  const [meal, setMeal] = useState<MealPlan | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const m = getCurrentMeal();
    setMeal(m);
    if (m) {
      isFavorite(m.meal_name).then(setIsFav).catch(() => {});
    }
    return () => { stop(); };
  }, []);

  const readStep = useCallback(async (text: string) => {
    try {
      stop();
      setIsSpeaking(true);
      speak(text, {
        language: 'es-ES',
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  useEffect(() => {
    if (autoRead && meal?.steps[step]) {
      readStep(meal.steps[step]);
    }
  }, [step, autoRead, meal, readStep]);

  if (!meal) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ padding: spacing.lg, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: colors.textSec }}>No se encontró la receta</Text>
          <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.back()}>
            <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: colors.green600 }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const steps = meal.steps;
  const current = steps[step] ?? '';
  const StepIcon = STEP_ICONS[step % STEP_ICONS.length];
  const isLast = step === steps.length - 1;

  async function handleToggleFavorite() {
    if (!meal) return;
    try {
      const nowFav = await toggleFavorite(meal);
      setIsFav(nowFav);
    } catch (_e) { /* toggle is best-effort */ }
  }

  async function handleDone() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    let consumed = 0;
    const ingredientNames = meal!.ingredients.map((i) => i.name);
    try {
      await markMealCooked(meal!.id);
      await incrementCooked();
      await incrementTimesCooked(meal!.meal_name).catch(() => {});
      consumed = await autoConsumePantryItems(ingredientNames);
      for (let i = 0; i < consumed; i++) {
        await incrementUsed().catch(() => {});
      }
    } catch (e: any) {
      Alert.alert('Aviso', e.message ?? 'No se pudo actualizar algunos datos, pero tu receta está lista');
    }
    clearCurrentMeal();
    if (consumed > 0) {
      Alert.alert(
        'Buen provecho!',
        `${consumed} ingrediente${consumed > 1 ? 's' : ''} marcado${consumed > 1 ? 's' : ''} como usado${consumed > 1 ? 's' : ''} en tu despensa`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } else {
      router.back();
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.lg, flex: 1 }}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.closeBtn} onPress={() => { clearCurrentMeal(); router.back(); }}>
            <X size={20} color={colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToggleFavorite} style={s.favBtn}>
            <Heart size={20} color={isFav ? colors.red500 : colors.textMuted} strokeWidth={2} fill={isFav ? colors.red500 : 'none'} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={s.titleRow}>
          <ChefHat size={15} color={colors.green600} strokeWidth={2.2} />
          <Text style={s.modeLabel}>MODO COCINA</Text>
        </View>
        <Text style={s.title}>{meal.meal_name}</Text>

        {/* Progress dots */}
        <View style={s.dots}>
          {steps.map((_: string, i: number) => (
            <View key={i} style={[s.dot, i <= step && s.dotActive, i === step && s.dotCurrent]} />
          ))}
        </View>

        {/* Step card */}
        <Animated.View key={step} entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)} style={s.stepCard}>
          <View style={s.stepIconBox}>
            <StepIcon size={36} color={colors.green600} strokeWidth={1.5} />
          </View>
          <Text style={s.stepNum}>PASO {step + 1} DE {steps.length}</Text>
          <Text style={s.stepText}>{current}</Text>
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* Navigation */}
        <View style={s.navRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep(Math.max(0, step - 1)); }}>
            <ChevronLeft size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.nextBtn, isLast && s.doneBtn]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); isLast ? handleDone() : setStep(step + 1); }}>
            {isLast && <Check size={18} color="white" strokeWidth={2.5} />}
            <Text style={[s.nextText, isLast && { color: 'white' }]}>
              {isLast ? 'Hecho' : 'Siguiente'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.voiceRow}>
          <TouchableOpacity
            style={[s.voiceBtn, isSpeaking && s.voiceBtnActive]}
            onPress={() => {
              if (isSpeaking) { stop(); setIsSpeaking(false); }
              else readStep(current);
            }}
          >
            {isSpeaking
              ? <VolumeX size={15} color={colors.violet400} strokeWidth={2} />
              : <Volume2 size={15} color={colors.violet400} strokeWidth={2} />
            }
            <Text style={s.voiceBtnText}>{isSpeaking ? 'Parar' : 'Leer paso'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.autoReadBtn, autoRead && s.autoReadBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAutoRead(!autoRead);
              if (!autoRead && current) readStep(current);
            }}
          >
            <Text style={[s.autoReadText, autoRead && s.autoReadTextActive]}>
              Auto-lectura {autoRead ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { padding: 4 },
  favBtn: { padding: 4 },
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
  navRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  backBtn: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  nextBtn: { flex: 1, height: 52, borderRadius: radius.lg, backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  doneBtn: { backgroundColor: colors.green600 },
  nextText: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  voiceRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  voiceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.violet50, borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  voiceBtnActive: { backgroundColor: colors.violet400 },
  voiceBtnText: { fontSize: 11, fontFamily: fonts.bold, color: colors.violet400 },
  autoReadBtn: {
    borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  autoReadBtnActive: { backgroundColor: colors.green50, borderColor: colors.green200 },
  autoReadText: { fontSize: 11, fontFamily: fonts.bold, color: colors.textMuted },
  autoReadTextActive: { color: colors.green600 },
});
