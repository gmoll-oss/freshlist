import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ChefHat, ChevronLeft, Check, Flame, Leaf, CookingPot, UtensilsCrossed, Timer, Volume2, X, Heart } from 'lucide-react-native';
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
  const router = useRouter();

  useEffect(() => {
    const m = getCurrentMeal();
    setMeal(m);
    if (m) {
      isFavorite(m.meal_name).then(setIsFav).catch(() => {});
    }
  }, []);

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
    } catch (_) {}
  }

  async function handleDone() {
    try {
      await markMealCooked(meal!.id);
      await incrementCooked();
      await incrementTimesCooked(meal!.meal_name).catch(() => {});
      const ingredientNames = meal!.ingredients.map((i) => i.name);
      const consumed = await autoConsumePantryItems(ingredientNames);
      for (let i = 0; i < consumed; i++) {
        await incrementUsed().catch(() => {});
      }
    } catch (_) {
      // best effort
    }
    clearCurrentMeal();
    router.back();
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
        <View style={s.stepCard}>
          <View style={s.stepIconBox}>
            <StepIcon size={36} color={colors.green600} strokeWidth={1.5} />
          </View>
          <Text style={s.stepNum}>PASO {step + 1} DE {steps.length}</Text>
          <Text style={s.stepText}>{current}</Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Navigation */}
        <View style={s.navRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => setStep(Math.max(0, step - 1))}>
            <ChevronLeft size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.nextBtn, isLast && s.doneBtn]}
            onPress={() => isLast ? handleDone() : setStep(step + 1)}>
            {isLast && <Check size={18} color="white" strokeWidth={2.5} />}
            <Text style={[s.nextText, isLast && { color: 'white' }]}>
              {isLast ? 'Hecho' : 'Siguiente'}
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
  voiceHint: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  voiceText: { fontSize: 11, color: colors.violet400, fontFamily: fonts.medium },
});
