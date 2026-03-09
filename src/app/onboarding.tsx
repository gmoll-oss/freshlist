import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { savePreferences } from '../services/supabase/preferences';
import type { UserPreferences } from '../types';

const TOTAL_STEPS = 6;

const DIET_OPTIONS = [
  'Omnivoro', 'Vegetariano', 'Vegano', 'Pescetariano', 'Sin gluten', 'Keto',
];

const INTOLERANCE_OPTIONS = [
  'Lactosa', 'Gluten', 'Frutos secos', 'Marisco', 'Huevo', 'Soja',
];

const COOKING_OPTIONS: { value: UserPreferences['cooking_time']; label: string; desc: string }[] = [
  { value: 'rapido', label: 'Rapido', desc: 'Menos de 15 min' },
  { value: 'normal', label: 'Normal', desc: '15–30 min' },
  { value: 'sin_prisa', label: 'Sin prisa', desc: 'Mas de 30 min' },
];

const HEALTH_GOALS = [
  'Perder peso',
  'Ganar masa muscular',
  'Menos hidratos',
  'Comer equilibrado',
  'Sin objetivo',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [peopleCount, setPeopleCount] = useState(2);
  const [mealsConfig, setMealsConfig] = useState({ breakfast: false, lunch: false, dinner: true });
  const [dietType, setDietType] = useState<string[]>(['Omnivoro']);
  const [cookingTime, setCookingTime] = useState<UserPreferences['cooking_time']>('normal');
  const [healthGoal, setHealthGoal] = useState<string | null>(null);
  const [intolerances, setIntolerances] = useState<string[]>([]);
  const [customIntolerance, setCustomIntolerance] = useState('');

  function canProceed(): boolean {
    if (step === 0) return name.trim().length > 0;
    if (step === 2) return mealsConfig.breakfast || mealsConfig.lunch || mealsConfig.dinner;
    if (step === 3) return dietType.length > 0;
    return true;
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function toggleDiet(item: string) {
    setDietType((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  }

  function toggleIntolerance(item: string) {
    setIntolerances((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  }

  function addCustomIntolerance() {
    const trimmed = customIntolerance.trim();
    if (trimmed && !intolerances.includes(trimmed)) {
      setIntolerances((prev) => [...prev, trimmed]);
      setCustomIntolerance('');
    }
  }

  async function handleFinish() {
    setSaving(true);
    try {
      await savePreferences({
        display_name: name.trim() || null,
        people_count: peopleCount,
        meals_config: mealsConfig,
        diet_type: dietType,
        cooking_time: cookingTime,
        health_goal: healthGoal === 'Sin objetivo' ? null : healthGoal,
        intolerances,
        onboarding_done: true,
      });
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Error saving preferences:', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Progress dots */}
      <View style={s.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[s.dot, i <= step && s.dotActive]} />
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Step 0: Name */}
        {step === 0 && (
          <Animated.View key="step0" entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text style={s.emoji}>👋</Text>
            <Text style={s.question}>Como te llamas?</Text>
            <Text style={s.hint}>Para personalizar tu experiencia</Text>
            <TextInput
              style={s.textInput}
              placeholder="Tu nombre"
              placeholderTextColor={colors.textDim}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
            />
          </Animated.View>
        )}

        {/* Step 1: People count */}
        {step === 1 && (
          <Animated.View key="step1" entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text style={s.emoji}>👥</Text>
            <Text style={s.question}>Cuantos comeis en casa?</Text>
            <Text style={s.hint}>Ajustaremos las raciones</Text>
            <View style={s.chipRow}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[s.chip, peopleCount === n && s.chipActive]}
                  onPress={() => setPeopleCount(n)}
                >
                  <Text style={[s.chipText, peopleCount === n && s.chipTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Step 2: Meals config (no days — that's per-week in plan screen) */}
        {step === 2 && (
          <Animated.View key="step2" entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text style={s.emoji}>🍽️</Text>
            <Text style={s.question}>Que comidas planificamos?</Text>
            <Text style={s.hint}>Selecciona al menos una</Text>
            <View style={s.toggleRow}>
              {([
                { key: 'breakfast' as const, emoji: '☕', label: 'Desayuno' },
                { key: 'lunch' as const, emoji: '🥗', label: 'Comida' },
                { key: 'dinner' as const, emoji: '🍲', label: 'Cena' },
              ]).map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[s.toggleCard, mealsConfig[m.key] && s.toggleCardActive]}
                  onPress={() => setMealsConfig((p) => ({ ...p, [m.key]: !p[m.key] }))}
                >
                  <Text style={s.toggleEmoji}>{m.emoji}</Text>
                  <Text style={[s.toggleLabel, mealsConfig[m.key] && s.toggleLabelActive]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Step 3: Diet type (multi-select) */}
        {step === 3 && (
          <Animated.View key="step3" entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text style={s.emoji}>🥑</Text>
            <Text style={s.question}>Tu tipo de dieta?</Text>
            <Text style={s.hint}>Puedes seleccionar varias</Text>
            <View style={s.chipRow}>
              {DIET_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[s.chipWide, dietType.includes(d) && s.chipActive]}
                  onPress={() => toggleDiet(d)}
                >
                  <Text style={[s.chipText, dietType.includes(d) && s.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Step 4: Cooking time */}
        {step === 4 && (
          <Animated.View key="step4" entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text style={s.emoji}>⏱️</Text>
            <Text style={s.question}>Cuanto tiempo tienes para cocinar?</Text>
            <Text style={s.hint}>Adaptaremos la complejidad de las recetas</Text>
            <View style={{ gap: 10 }}>
              {COOKING_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.optionCard, cookingTime === opt.value && s.optionCardActive]}
                  onPress={() => setCookingTime(opt.value)}
                >
                  <Text style={[s.optionTitle, cookingTime === opt.value && s.optionTitleActive]}>{opt.label}</Text>
                  <Text style={[s.optionDesc, cookingTime === opt.value && s.optionDescActive]}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Step 5: Health goal + Intolerances (last step) */}
        {step === 5 && (
          <Animated.View key="step5" entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
            <Text style={s.emoji}>🎯</Text>
            <Text style={s.question}>Algun objetivo o intolerancia?</Text>

            <Text style={[s.hint, { marginBottom: 12 }]}>Objetivo (opcional)</Text>
            <View style={[s.chipRow, { marginBottom: 24 }]}>
              {HEALTH_GOALS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[s.chipWide, healthGoal === g && s.chipActive]}
                  onPress={() => setHealthGoal((prev) => (prev === g ? null : g))}
                >
                  <Text style={[s.chipText, healthGoal === g && s.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.hint, { marginBottom: 12 }]}>Intolerancias (opcional)</Text>
            <View style={s.chipRow}>
              {INTOLERANCE_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[s.chipWide, intolerances.includes(item) && s.chipActive]}
                  onPress={() => toggleIntolerance(item)}
                >
                  <Text style={[s.chipText, intolerances.includes(item) && s.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.customRow}>
              <TextInput
                style={[s.textInput, { flex: 1 }]}
                placeholder="Otra..."
                placeholderTextColor={colors.textDim}
                value={customIntolerance}
                onChangeText={setCustomIntolerance}
                onSubmitEditing={addCustomIntolerance}
              />
              {customIntolerance.trim().length > 0 && (
                <TouchableOpacity style={s.addBtn} onPress={addCustomIntolerance}>
                  <Text style={s.addBtnText}>+</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={s.footer}>
        {step > 0 ? (
          <TouchableOpacity style={s.backBtn} onPress={handleBack}>
            <ChevronLeft size={20} color={colors.textMuted} />
            <Text style={s.backText}>Atras</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity
          style={[s.nextBtn, !canProceed() && s.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || saving}
        >
          {step === TOTAL_STEPS - 1 ? (
            <>
              <Sparkles size={16} color="white" strokeWidth={2.5} />
              <Text style={s.nextText}>{saving ? 'Guardando...' : 'Empezar'}</Text>
            </>
          ) : (
            <>
              <Text style={s.nextText}>Siguiente</Text>
              <ChevronRight size={18} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.green500 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, flexGrow: 1 },
  emoji: { fontSize: 40, marginBottom: 12 },
  question: { fontSize: 24, fontFamily: fonts.black, color: colors.text, marginBottom: 6 },
  hint: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.regular, marginBottom: 24 },
  textInput: {
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: fonts.medium, color: colors.text,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.card,
    borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center',
  },
  chipWide: {
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.md,
    backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border,
  },
  chipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  chipText: { fontSize: 15, fontFamily: fonts.bold, color: colors.textSec },
  chipTextActive: { color: colors.green700 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleCard: {
    flex: 1, paddingVertical: 20, borderRadius: radius.lg, backgroundColor: colors.card,
    borderWidth: 2, borderColor: colors.border, alignItems: 'center', gap: 6,
  },
  toggleCardActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  toggleEmoji: { fontSize: 26 },
  toggleLabel: { fontSize: 13, fontFamily: fonts.bold, color: colors.textSec },
  toggleLabelActive: { color: colors.green700 },
  optionCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 18,
    borderWidth: 2, borderColor: colors.border,
  },
  optionCardActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  optionTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  optionTitleActive: { color: colors.green700 },
  optionDesc: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 2 },
  optionDescActive: { color: colors.green600 },
  customRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  addBtn: {
    width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.green500,
    justifyContent: 'center', alignItems: 'center',
  },
  addBtnText: { fontSize: 22, fontFamily: fonts.bold, color: 'white' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: 16,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 8 },
  backText: { fontSize: 15, fontFamily: fonts.medium, color: colors.textMuted },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.green600,
    borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 24,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextText: { fontSize: 15, fontFamily: fonts.bold, color: 'white' },
});
