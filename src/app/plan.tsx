import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal } from 'react-native';
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
  Package,
  AlertTriangle,
  Coffee,
  CookingPot,
  Apple,
  Repeat,
  ArrowRight,
  X,
  Users,
  Trash2,
  ArrowRightLeft,
  MessageCircle,
} from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useMealPlan } from '../hooks/useMealPlan';
import { setCurrentMeal } from '../services/mealPlan/mealPlanStore';
import { cancelMeal, changeServings, shiftPlanByDays, swapDays } from '../services/supabase/mealPlans';
import type { MealPlan, MealType } from '../types';

const ALL_DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const DAY_SHORT: Record<string, string> = {
  Lunes: 'L', Martes: 'M', Miercoles: 'X', Jueves: 'J',
  Viernes: 'V', Sabado: 'S', Domingo: 'D',
};

const MEAL_TYPE_CONFIG: Record<MealType, { label: string; Icon: any; color: string }> = {
  breakfast: { label: 'Desayuno', Icon: Coffee, color: colors.orange500 },
  lunch: { label: 'Comida', Icon: UtensilsCrossed, color: colors.green600 },
  dinner: { label: 'Cena', Icon: CookingPot, color: colors.violet400 },
  snack: { label: 'Snack', Icon: Apple, color: colors.amber400 },
};

const MEAL_TYPE_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function PlanScreen() {
  const router = useRouter();
  const { plans, loading, generating, error, load, generate, markCooked, weekStart, previousDays, pantryCount, expiringSoonCount } = useMealPlan();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [actionMeal, setActionMeal] = useState<MealPlan | null>(null);
  const [servingsModal, setServingsModal] = useState<MealPlan | null>(null);
  const [selectedServings, setSelectedServings] = useState(2);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());

  function toggleIngredients(id: string) {
    setExpandedMeals((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

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
    const currentDays = [...new Set(plans.map((p) => p.day))];
    const sorted = ALL_DAYS.filter((d) => currentDays.includes(d));
    generate(sorted);
  }

  async function handleCancelMeal(meal: MealPlan) {
    setActionMeal(null);
    try {
      await cancelMeal(meal.id);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleShiftPlan() {
    setActionMeal(null);
    try {
      await shiftPlanByDays(weekStart, 1);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  function openServingsModal(meal: MealPlan) {
    setActionMeal(null);
    setSelectedServings(meal.servings);
    setServingsModal(meal);
  }

  async function handleChangeServings() {
    if (!servingsModal) return;
    try {
      await changeServings(servingsModal.id, selectedServings);
      setServingsModal(null);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  const hasPlan = plans.length > 0;

  // Group plans by day
  const plansByDay = ALL_DAYS.reduce<Record<string, MealPlan[]>>((acc, day) => {
    const dayMeals = plans.filter((p) => p.day === day);
    if (dayMeals.length > 0) {
      acc[day] = dayMeals.sort((a, b) =>
        MEAL_TYPE_ORDER.indexOf(a.meal_type) - MEAL_TYPE_ORDER.indexOf(b.meal_type)
      );
    }
    return acc;
  }, {});

  // Count reused meals
  const reusedCount = plans.filter((p) => p.reuses_from).length;
  const totalMeals = plans.length;

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

          {pantryCount > 0 && (
            <View style={s.pantryContext}>
              <View style={s.pantryContextIcon}>
                <Package size={16} color={colors.green600} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.pantryContextText}>
                  {pantryCount} ingredientes en despensa
                </Text>
                {expiringSoonCount > 0 && (
                  <View style={s.pantryWarnRow}>
                    <AlertTriangle size={11} color={colors.orange500} strokeWidth={2.5} />
                    <Text style={s.pantryWarnText}>
                      {expiringSoonCount} caducan pronto — se priorizaran
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

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

          {/* Autopilot banner */}
          <TouchableOpacity style={s.autopilotBanner} onPress={() => router.push('/autopilot' as any)}>
            <Sparkles size={18} color={colors.green600} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={s.autopilotTitle}>Planifica todo por mi</Text>
              <Text style={s.autopilotSub}>Menu + compra en un toque</Text>
            </View>
            <ArrowRight size={16} color={colors.green600} strokeWidth={2} />
          </TouchableOpacity>

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
          {/* Summary stats */}
          {reusedCount > 0 && (
            <View style={s.batchSummary}>
              <Repeat size={14} color={colors.green600} strokeWidth={2} />
              <Text style={s.batchSummaryText}>
                Esta semana cocinas {totalMeals - reusedCount} veces pero comes {totalMeals}. {reusedCount} son sobras inteligentes
              </Text>
            </View>
          )}

          {/* Regenerate button */}
          <TouchableOpacity style={s.regenBtn} onPress={handleRegenerate}>
            <RefreshCw size={14} color={colors.green600} strokeWidth={2.5} />
            <Text style={s.regenText}>Regenerar plan</Text>
          </TouchableOpacity>

          {Object.entries(plansByDay).map(([day, meals]) => (
            <View key={day} style={s.daySection}>
              <Text style={s.daySectionTitle}>{day.toUpperCase()}</Text>
              {meals.map((meal) => {
                const typeConfig = MEAL_TYPE_CONFIG[meal.meal_type] ?? MEAL_TYPE_CONFIG.dinner;
                const TypeIcon = typeConfig.Icon;
                return (
                  <TouchableOpacity
                    key={meal.id}
                    style={[s.mealCard, meal.cooked && s.mealCardCooked]}
                    onLongPress={() => !meal.cooked && setActionMeal(meal)}
                    activeOpacity={0.7}
                  >
                    <View style={s.mealTypeTag}>
                      <TypeIcon size={11} color={typeConfig.color} strokeWidth={2.5} />
                      <Text style={[s.mealTypeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
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
                        <Users size={12} color={colors.green600} strokeWidth={2.2} />
                        <Text style={s.metaText}>{meal.servings} pers</Text>
                      </View>
                      {meal.ingredients.length > 0 && (
                        <TouchableOpacity onPress={() => toggleIngredients(meal.id)} style={s.ingredToggle}>
                          <Package size={11} color={colors.textMuted} strokeWidth={2} />
                          <Text style={s.ingredToggleText}>
                            {expandedMeals.has(meal.id) ? 'Ocultar' : `${meal.ingredients.length} ingr.`}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {expandedMeals.has(meal.id) && meal.ingredients.length > 0 && (
                      <View style={s.ingredList}>
                        {meal.ingredients.map((ing, idx) => (
                          <Text key={idx} style={s.ingredItem}>
                            {ing.amount} {ing.name}
                          </Text>
                        ))}
                      </View>
                    )}

                    {meal.reuses_from && (
                      <View style={s.reusesNote}>
                        <Repeat size={11} color={colors.green600} strokeWidth={2.5} />
                        <Text style={s.reusesText}>Usa sobras de: {meal.reuses_from}</Text>
                      </View>
                    )}

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
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Long press action modal */}
      <Modal visible={!!actionMeal} transparent animationType="fade" onRequestClose={() => setActionMeal(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setActionMeal(null)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>{actionMeal?.meal_name}</Text>
            <Text style={s.modalSub}>{actionMeal?.day}</Text>

            <TouchableOpacity style={s.modalAction} onPress={handleShiftPlan}>
              <ArrowRight size={16} color={colors.text} strokeWidth={2} />
              <Text style={s.modalActionText}>Mover todo a manana</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.modalAction} onPress={() => actionMeal && openServingsModal(actionMeal)}>
              <Users size={16} color={colors.text} strokeWidth={2} />
              <Text style={s.modalActionText}>Cambiar raciones</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.modalAction} onPress={() => actionMeal && handleCancelMeal(actionMeal)}>
              <Trash2 size={16} color={colors.red500} strokeWidth={2} />
              <Text style={[s.modalActionText, { color: colors.red500 }]}>No voy a cocinar hoy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.modalAction} onPress={() => { setActionMeal(null); router.push('/chat' as any); }}>
              <MessageCircle size={16} color={colors.green600} strokeWidth={2} />
              <Text style={[s.modalActionText, { color: colors.green600 }]}>Pedir algo diferente a la IA</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.modalCancel} onPress={() => setActionMeal(null)}>
              <Text style={s.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Servings modal */}
      <Modal visible={!!servingsModal} transparent animationType="fade" onRequestClose={() => setServingsModal(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setServingsModal(null)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Cambiar raciones</Text>
            <Text style={s.modalSub}>{servingsModal?.meal_name}</Text>
            <View style={s.servingsRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[s.servingsChip, selectedServings === n && s.servingsChipActive]}
                  onPress={() => setSelectedServings(n)}
                >
                  <Text style={[s.servingsChipText, selectedServings === n && s.servingsChipTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.generateBtn} onPress={handleChangeServings}>
              <Text style={s.generateBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  emptyBox: { alignItems: 'center', paddingHorizontal: 32, marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, marginTop: 16 },
  emptySub: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.regular, textAlign: 'center', marginTop: 6 },
  pantryContext: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderRadius: radius.md, padding: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 16,
  },
  pantryContextIcon: {
    width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.green50,
    justifyContent: 'center', alignItems: 'center',
  },
  pantryContextText: { fontSize: 13, fontFamily: fonts.bold, color: colors.text },
  pantryWarnRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  pantryWarnText: { fontSize: 11, fontFamily: fonts.medium, color: colors.orange500 },
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
  quickActions: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md,
    backgroundColor: colors.green50, borderWidth: 1, borderColor: colors.green200,
  },
  quickBtnText: { fontSize: 12, fontFamily: fonts.bold, color: colors.green600 },
  autopilotBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.green50, borderRadius: radius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.green200, marginBottom: 14,
  },
  autopilotTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.green700 },
  autopilotSub: { fontSize: 11, fontFamily: fonts.regular, color: colors.green600 },
  generateBtn: {
    backgroundColor: colors.green600, borderRadius: radius.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  generateBtnText: { fontSize: 15, fontFamily: fonts.bold, color: 'white' },
  batchSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.green50, borderRadius: radius.md, padding: 12, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.green200,
  },
  batchSummaryText: { flex: 1, fontSize: 12, fontFamily: fonts.medium, color: colors.green700 },
  regenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.green50, borderRadius: radius.md, paddingVertical: 10, marginBottom: spacing.md,
  },
  regenText: { fontSize: 12, fontFamily: fonts.bold, color: colors.green600 },
  daySection: { marginBottom: spacing.md },
  daySectionTitle: {
    fontSize: 11, fontFamily: fonts.bold, color: colors.textMuted,
    letterSpacing: 1, marginBottom: 8, marginLeft: 2,
  },
  mealCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  mealCardCooked: { opacity: 0.6 },
  mealTypeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  mealTypeText: { fontSize: 10, fontFamily: fonts.bold, letterSpacing: 0.6 },
  cookedBadge: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: colors.green500,
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
  },
  mealName: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, marginBottom: 8 },
  mealNameCooked: { textDecorationLine: 'line-through' },
  mealMeta: { flexDirection: 'row', gap: 16, marginBottom: 8, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: fonts.medium, color: colors.textSec },
  ingredToggle: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ingredToggleText: { fontSize: 11, fontFamily: fonts.medium, color: colors.textMuted },
  ingredList: { backgroundColor: colors.surface, borderRadius: radius.sm, padding: 10, marginBottom: 8 },
  ingredItem: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSec, lineHeight: 20 },
  reusesNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.green50, borderRadius: radius.sm, padding: 8, marginBottom: 8,
  },
  reusesText: { fontSize: 11, fontFamily: fonts.medium, color: colors.green700 },
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

  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    padding: spacing.lg, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, marginBottom: 4 },
  modalSub: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.regular, marginBottom: 20 },
  modalAction: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  modalActionText: { fontSize: 15, fontFamily: fonts.medium, color: colors.text },
  modalCancel: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  modalCancelText: { fontSize: 15, fontFamily: fonts.bold, color: colors.textMuted },

  // Servings
  servingsRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  servingsChip: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.border,
  },
  servingsChipActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  servingsChipText: { fontSize: 16, fontFamily: fonts.bold, color: colors.textMuted },
  servingsChipTextActive: { color: colors.green700 },
});
