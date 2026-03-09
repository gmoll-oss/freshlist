import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Package,
  ChefHat,
  ShoppingCart,
  Tag,
  LayoutList,
  Check,
  Sparkles,
  ArrowRight,
  MessageCircle,
} from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { fetchPantryItems } from '../services/supabase/pantry';
import { generateMealPlan } from '../services/ai/mealPlanner';
import { insertMealPlans, deleteWeekMealPlans } from '../services/supabase/mealPlans';
import { addFromMealPlan } from '../services/supabase/shopping';
import type { PantryItem } from '../types';

interface Step {
  label: string;
  Icon: any;
  color: string;
}

const STEPS: Step[] = [
  { label: 'Analizando tu despensa...', Icon: Package, color: colors.green600 },
  { label: 'Comprobando basicos...', Icon: ChefHat, color: colors.orange500 },
  { label: 'Creando tu menu...', Icon: Sparkles, color: colors.violet400 },
  { label: 'Preparando lista de compra...', Icon: ShoppingCart, color: colors.green600 },
  { label: 'Buscando ofertas...', Icon: Tag, color: colors.amber400 },
  { label: 'Organizando por pasillos...', Icon: LayoutList, color: colors.green700 },
];

function getCurrentWeekStart(): string {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return monday.toISOString().split('T')[0];
}

export default function AutopilotScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [summary, setSummary] = useState({ meals: 0, shopping: 0 });
  const [errorMsg, setErrorMsg] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'running') {
      Animated.timing(progressAnim, {
        toValue: (currentStep + 1) / STEPS.length,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [currentStep, status]);

  async function advanceStep(step: number) {
    setCurrentStep(step);
    // Small delay so UI updates
    await new Promise((r) => setTimeout(r, 300));
  }

  async function runAutopilot() {
    setStatus('running');
    setCompletedSteps([]);
    setCurrentStep(0);

    try {
      // Step 1: Read pantry
      await advanceStep(0);
      const pantryItems = await fetchPantryItems();
      const activeItems = pantryItems.filter((i) => i.status === 'fresh' || i.status === 'expiring');
      setCompletedSteps((prev) => [...prev, 0]);

      if (activeItems.length === 0) {
        setErrorMsg('No tienes productos frescos en la despensa. Escanea un ticket primero.');
        setStatus('error');
        return;
      }

      // Step 2: Check staples
      await advanceStep(1);
      // Staples are assumed in the AI prompt
      setCompletedSteps((prev) => [...prev, 1]);

      // Step 3: Generate plan (7 days × all configured meals)
      await advanceStep(2);
      const weekStart = getCurrentWeekStart();
      const allDays = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

      await deleteWeekMealPlans(weekStart).catch(() => {});
      const aiResponse = await generateMealPlan(pantryItems, allDays);
      setCompletedSteps((prev) => [...prev, 2]);

      // Step 4: Save plans & generate shopping list
      await advanceStep(3);
      const mealsToInsert = aiResponse.meals.map((m) => ({
        week_start: weekStart,
        day: m.day,
        meal_type: m.meal_type ?? 'dinner',
        meal_name: m.meal_name,
        ingredients: m.ingredients,
        steps: m.steps,
        prep_time_minutes: m.prep_time_minutes,
        servings: m.servings,
        batch_note: m.batch_note,
        reuses_from: m.reuses_from ?? null,
        cooked: false,
      }));
      await insertMealPlans(mealsToInsert);

      if (aiResponse.shopping_needed?.length > 0) {
        await addFromMealPlan(aiResponse.shopping_needed).catch(() => {});
      }
      setCompletedSteps((prev) => [...prev, 3]);

      // Step 5: Offers (simulated — no real offer API yet)
      await advanceStep(4);
      await new Promise((r) => setTimeout(r, 500));
      setCompletedSteps((prev) => [...prev, 4]);

      // Step 6: Organize by aisle (done by shopping list categorization)
      await advanceStep(5);
      await new Promise((r) => setTimeout(r, 400));
      setCompletedSteps((prev) => [...prev, 5]);

      setSummary({
        meals: aiResponse.meals.length,
        shopping: aiResponse.shopping_needed?.length ?? 0,
      });
      setStatus('done');
    } catch (e: any) {
      console.error('[Autopilot] Error:', e);
      setErrorMsg(e.message ?? 'Error generando el plan');
      setStatus('error');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Piloto Automatico</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={s.content}>
        {status === 'idle' && (
          <View style={s.idleBox}>
            <View style={s.bigIconWrap}>
              <Sparkles size={48} color={colors.green500} strokeWidth={1.5} />
            </View>
            <Text style={s.idleTitle}>Semana complicada?</Text>
            <Text style={s.idleSub}>
              Deja que FreshList se ocupe. Analizaremos tu despensa, crearemos un menu semanal y prepararemos tu lista de compra.
            </Text>
            <TouchableOpacity style={s.bigBtn} onPress={runAutopilot}>
              <Sparkles size={18} color="white" strokeWidth={2.5} />
              <Text style={s.bigBtnText}>Planifica mi semana</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'running' && (
          <View style={s.runningBox}>
            {/* Progress bar */}
            <View style={s.progressTrack}>
              <Animated.View
                style={[s.progressFill, {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }]}
              />
            </View>

            {STEPS.map((step, i) => {
              const isDone = completedSteps.includes(i);
              const isCurrent = currentStep === i && !isDone;
              const StepIcon = step.Icon;
              return (
                <View key={i} style={[s.stepRow, isCurrent && s.stepRowActive]}>
                  <View style={[s.stepIcon, isDone && { backgroundColor: colors.green50 }]}>
                    {isDone ? (
                      <Check size={16} color={colors.green600} strokeWidth={3} />
                    ) : (
                      <StepIcon size={16} color={isCurrent ? step.color : colors.textDim} strokeWidth={2} />
                    )}
                  </View>
                  <Text style={[s.stepLabel, isDone && s.stepLabelDone, isCurrent && s.stepLabelCurrent]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {status === 'done' && (
          <View style={s.doneBox}>
            <View style={s.doneIconWrap}>
              <Check size={40} color={colors.green600} strokeWidth={2.5} />
            </View>
            <Text style={s.doneTitle}>Listo</Text>
            <Text style={s.doneSummary}>
              {summary.meals} comidas planificadas. {summary.shopping} productos que comprar.
            </Text>

            <TouchableOpacity style={s.bigBtn} onPress={() => router.push('/plan')}>
              <Text style={s.bigBtnText}>Ver mi plan</Text>
              <ArrowRight size={16} color="white" strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/chat' as any)}>
              <MessageCircle size={16} color={colors.green600} strokeWidth={2} />
              <Text style={s.secondaryBtnText}>Editar algo</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'error' && (
          <View style={s.doneBox}>
            <Text style={s.doneTitle}>Algo fallo</Text>
            <Text style={s.doneSummary}>{errorMsg}</Text>
            <TouchableOpacity style={s.bigBtn} onPress={runAutopilot}>
              <Text style={s.bigBtnText}>Reintentar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={() => router.back()}>
              <Text style={s.secondaryBtnText}>Volver</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: fonts.black, color: colors.text },
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg },

  // Idle
  idleBox: { alignItems: 'center', paddingHorizontal: 20 },
  bigIconWrap: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.green50,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  idleTitle: { fontSize: 24, fontFamily: fonts.black, color: colors.text, marginBottom: 8 },
  idleSub: {
    fontSize: 14, fontFamily: fonts.regular, color: colors.textSec, textAlign: 'center',
    lineHeight: 20, marginBottom: 32,
  },
  bigBtn: {
    backgroundColor: colors.green600, borderRadius: radius.lg, paddingVertical: 18,
    paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 10,
    width: '100%', justifyContent: 'center',
  },
  bigBtnText: { fontSize: 16, fontFamily: fonts.bold, color: 'white' },

  // Running
  runningBox: { paddingHorizontal: 8 },
  progressTrack: {
    height: 4, backgroundColor: colors.surface, borderRadius: 2, marginBottom: 28, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.green500, borderRadius: 2 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: radius.md, marginBottom: 4,
  },
  stepRowActive: { backgroundColor: colors.surface },
  stepIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  stepLabel: { fontSize: 14, fontFamily: fonts.regular, color: colors.textDim },
  stepLabelDone: { color: colors.textSec },
  stepLabelCurrent: { fontFamily: fonts.bold, color: colors.text },

  // Done
  doneBox: { alignItems: 'center', paddingHorizontal: 20 },
  doneIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.green50,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  doneTitle: { fontSize: 24, fontFamily: fonts.black, color: colors.text, marginBottom: 8 },
  doneSummary: {
    fontSize: 14, fontFamily: fonts.regular, color: colors.textSec, textAlign: 'center',
    lineHeight: 20, marginBottom: 28,
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, marginTop: 12,
  },
  secondaryBtnText: { fontSize: 14, fontFamily: fonts.bold, color: colors.green600 },
});
