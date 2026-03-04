import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChefHat,
  Timer,
  UtensilsCrossed,
  RefreshCw,
  Sparkles,
  Check,
  RotateCcw,
} from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useMealPlan } from '../hooks/useMealPlan';
import { setCurrentMeal } from '../services/mealPlan/mealPlanStore';
import type { MealPlan } from '../types';

const ALL_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const DAY_SHORT: Record<string, string> = {
  Lunes: 'L', Martes: 'M', Miercoles: 'X', Jueves: 'J',
  Viernes: 'V', Sabado: 'S', Domingo: 'D',
};

export default function PlanScreen() {
  const router = useRouter();
  const { plans, loading, generating, error, load, generate, markCooked, previousDays } = useMealPlan();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (error) Alert.alert('Error', error);
  }, [error]);

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function usePreviousWeek() {
    setSelectedDays([...previousDays]);
  }

  function selectAllDays() {
    setSelectedDays(selectedDays.length === ALL_DAYS.length ? [] : [...ALL_DAYS]);
  }

  function handleGenerate() {
    if (selectedDays.length === 0) return;
    // Sort days in week order
    const sorted = ALL_DAYS.filter((d) => selectedDays.includes(d));
    generate(sorted);
  }

  function handleCook(meal: MealPlan) {
    setCurrentMeal(meal);
    router.push(`/cook/${meal.id}`);
  }

  async function handleMarkCooked(meal: MealPlan) {
    await markCooked(meal.id);
  }

  function handleRegenerate() {
    // Get days from current plan
    const currentDays = [...new Set(plans.map((p) => p.day))];
    const sorted = ALL_DAYS.filter((d) => currentDays.includes(d));
    generate(sorted);
  }

  const hasPlan = plans.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Plan Semanal</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.green600} />
        </View>
      ) : generating ? (
        <View style={s.center}>
          <View style={s.genBox}>
            <Sparkles size={32} color={colors.green600} strokeWidth={1.5} />
            <Text style={s.genTitle}>Generando tu plan...</Text>
            <Text style={s.genSub}>Analizando tu despensa y creando recetas personalizadas</Text>
            <ActivityIndicator size="small" color={colors.green600} style={{ marginTop: 16 }} />
          </View>
        </View>
      ) : !hasPlan ? (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}>
          <View style={s.emptyBox}>
            <ChefHat size={48} color={colors.green400} strokeWidth={1.2} />
            <Text style={s.emptyTitle}>Planifica tu semana</Text>
            <Text style={s.emptySub}>Elige los dias que quieres cocinar</Text>
          </View>

          {/* Day selector */}
          <View style={s.dayRow}>
            {ALL_DAYS.map((day) => (
              <TouchableOpacity
                key={day}
                style={[s.dayChip, selectedDays.includes(day) && s.dayChipActive]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[s.dayChipText, selectedDays.includes(day) && s.dayChipTextActive]}>
                  {DAY_SHORT[day]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick actions */}
          <View style={s.quickActions}>
            <TouchableOpacity style={s.quickBtn} onPress={selectAllDays}>
              <Text style={s.quickBtnText}>
                {selectedDays.length === ALL_DAYS.length ? 'Quitar todos' : 'Toda la semana'}
              </Text>
            </TouchableOpacity>

            {previousDays.length > 0 && (
              <TouchableOpacity style={s.quickBtn} onPress={usePreviousWeek}>
                <RotateCcw size={13} color={colors.green600} strokeWidth={2.5} />
                <Text style={s.quickBtnText}>Igual que la anterior</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Generate button */}
          <TouchableOpacity
            style={[s.generateBtn, selectedDays.length === 0 && { opacity: 0.4 }]}
            onPress={handleGenerate}
            disabled={selectedDays.length === 0}
          >
            <Sparkles size={16} color="white" strokeWidth={2.5} />
            <Text style={s.generateBtnText}>
              Generar plan ({selectedDays.length} {selectedDays.length === 1 ? 'dia' : 'dias'})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView style={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
          {/* Regenerate button */}
          <TouchableOpacity style={s.regenBtn} onPress={handleRegenerate}>
            <RefreshCw size={14} color={colors.green600} strokeWidth={2.5} />
            <Text style={s.regenText}>Regenerar plan</Text>
          </TouchableOpacity>

          {plans.map((meal) => (
            <View key={meal.id} style={[s.mealCard, meal.cooked && s.mealCardCooked]}>
              <View style={s.dayTag}>
                <Text style={s.dayText}>{meal.day.toUpperCase()}</Text>
                {meal.cooked && (
                  <View style={s.cookedBadge}>
                    <Check size={10} color="white" strokeWidth={3} />
                  </View>
                )}
              </View>
              <Text style={[s.mealName, meal.cooked && s.mealNameCooked]}>{meal.meal_name}</Text>

              <View style={s.mealMeta}>
                <View style={s.metaItem}>
                  <Timer size={12} color={colors.green600} strokeWidth={2.2} />
                  <Text style={s.metaText}>{meal.prep_time_minutes} min</Text>
                </View>
                <View style={s.metaItem}>
                  <UtensilsCrossed size={12} color={colors.green600} strokeWidth={2.2} />
                  <Text style={s.metaText}>{meal.servings} pers</Text>
                </View>
              </View>

              {meal.batch_note && (
                <View style={s.batchNote}>
                  <Text style={s.batchText}>{meal.batch_note}</Text>
                </View>
              )}

              {!meal.cooked && (
                <View style={s.mealActions}>
                  <TouchableOpacity style={s.cookBtn} onPress={() => handleCook(meal)}>
                    <ChefHat size={14} color="white" strokeWidth={2.5} />
                    <Text style={s.cookBtnText}>Cocinar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.doneSmBtn} onPress={() => handleMarkCooked(meal)}>
                    <Check size={14} color={colors.green600} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  genBox: { alignItems: 'center', paddingHorizontal: 40 },
  genTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, marginTop: 16 },
  genSub: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.regular, textAlign: 'center', marginTop: 6 },
  emptyBox: { alignItems: 'center', paddingHorizontal: 32, marginBottom: 28 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, marginTop: 16 },
  emptySub: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.regular, textAlign: 'center', marginTop: 6 },
  dayRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: 14,
  },
  dayChip: {
    flex: 1, height: 48, borderRadius: radius.md, backgroundColor: colors.card,
    borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center',
  },
  dayChipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  dayChipText: { fontSize: 15, fontFamily: fonts.bold, color: colors.textMuted },
  dayChipTextActive: { color: colors.green700 },
  quickActions: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: colors.green50, borderWidth: 1, borderColor: colors.green200,
  },
  quickBtnText: { fontSize: 12, fontFamily: fonts.bold, color: colors.green600 },
  generateBtn: {
    backgroundColor: colors.green600, borderRadius: radius.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  generateBtnText: { fontSize: 15, fontFamily: fonts.bold, color: 'white' },
  regenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.green50, borderRadius: radius.md, paddingVertical: 10, marginBottom: spacing.md,
  },
  regenText: { fontSize: 12, fontFamily: fonts.bold, color: colors.green600 },
  mealCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 10,
  },
  mealCardCooked: { opacity: 0.6 },
  dayTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dayText: { fontSize: 10, fontFamily: fonts.bold, color: colors.green600, letterSpacing: 0.8 },
  cookedBadge: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: colors.green500,
    justifyContent: 'center', alignItems: 'center',
  },
  mealName: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, marginBottom: 8 },
  mealNameCooked: { textDecorationLine: 'line-through' },
  mealMeta: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: fonts.medium, color: colors.textSec },
  batchNote: { backgroundColor: colors.orange50, borderRadius: radius.sm, padding: 8, marginBottom: 10 },
  batchText: { fontSize: 11, fontFamily: fonts.medium, color: colors.orange500 },
  mealActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cookBtn: {
    flex: 1, backgroundColor: colors.green600, borderRadius: radius.md, paddingVertical: 10,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  cookBtnText: { fontSize: 13, fontFamily: fonts.bold, color: 'white' },
  doneSmBtn: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.green50,
    justifyContent: 'center', alignItems: 'center',
  },
});
