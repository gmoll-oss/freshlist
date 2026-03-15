import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, CookingPot, CalendarCheck, Leaf, Trash2, TrendingUp, Sparkles, ChevronRight } from 'lucide-react-native';
import ReAnimated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { generateAndSaveSummary, fetchWeeklySummary, getPreviousWeekStart, getCurrentWeekStart, updateAiFeedback } from '../services/supabase/weeklySummary';
import { generateWeeklyInsight } from '../services/ai/weeklyInsight';
import type { WeeklySummary, WeeklyInsightResponse } from '../types';

export default function WeeklySummaryScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [prevSummary, setPrevSummary] = useState<WeeklySummary | null>(null);
  const [insight, setInsight] = useState<WeeklyInsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const weekStart = getCurrentWeekStart();
      const prevWeekStart = getPreviousWeekStart();

      // Try fetching existing summary first, otherwise generate
      let current = await fetchWeeklySummary(weekStart);
      if (!current) {
        current = await generateAndSaveSummary(weekStart);
      }
      setSummary(current);

      const prev = await fetchWeeklySummary(prevWeekStart);
      setPrevSummary(prev);

      // Load AI feedback
      if (current.ai_feedback) {
        try {
          setInsight(JSON.parse(current.ai_feedback));
        } catch {
          loadInsight(current, prev);
        }
      } else {
        loadInsight(current, prev);
      }
    } catch (e) {
      console.warn('Error loading weekly summary:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadInsight(current: WeeklySummary, prev: WeeklySummary | null) {
    setLoadingInsight(true);
    try {
      const result = await generateWeeklyInsight(current, prev);
      setInsight(result);
      await updateAiFeedback(current.week_start, JSON.stringify(result));
    } catch (e) {
      console.warn('Error generating insight:', e);
    } finally {
      setLoadingInsight(false);
    }
  }

  function compareStat(current: number, previous: number | undefined): string {
    if (previous === undefined) return '';
    const diff = current - previous;
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return '=';
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.headerBack}>
            <ChevronLeft size={22} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={s.title}>Resumen Semanal</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.green600} />
          <Text style={{ marginTop: 12, fontFamily: fonts.medium, color: colors.textMuted, fontSize: 13 }}>
            Preparando tu resumen...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!summary) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.headerBack}>
            <ChevronLeft size={22} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={s.title}>Resumen Semanal</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontFamily: fonts.medium, color: colors.textMuted, fontSize: 14, textAlign: 'center' }}>
            No hay datos suficientes para generar un resumen esta semana.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats = [
    { v: String(summary.meals_cooked), l: 'Cocinadas', sub: `de ${summary.meals_planned} planificadas`, fg: colors.green600, bg: colors.green50, Icon: CookingPot, cmp: compareStat(summary.meals_cooked, prevSummary?.meals_cooked) },
    { v: String(summary.meals_planned), l: 'Planificadas', sub: 'esta semana', fg: colors.violet400, bg: colors.violet50, Icon: CalendarCheck, cmp: compareStat(summary.meals_planned, prevSummary?.meals_planned) },
    { v: String(summary.products_saved), l: 'Aprovechados', sub: 'productos', fg: colors.green600, bg: colors.green50, Icon: Leaf, cmp: compareStat(summary.products_saved, prevSummary?.products_saved) },
    { v: String(summary.products_thrown), l: 'Tirados', sub: 'productos', fg: summary.products_thrown === 0 ? colors.green600 : colors.red400, bg: summary.products_thrown === 0 ? colors.green50 : colors.red50, Icon: Trash2, cmp: compareStat(summary.products_thrown, prevSummary?.products_thrown) },
    { v: `${summary.euros_saved}€`, l: 'Ahorrados', sub: 'esta semana', fg: colors.amber400, bg: '#FFFBEB', Icon: TrendingUp, cmp: compareStat(summary.euros_saved, prevSummary?.euros_saved) },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.headerBack}>
            <ChevronLeft size={22} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={s.headerRow}>
              <Sparkles size={14} color={colors.amber400} strokeWidth={2.2} />
              <Text style={s.headerLabel}>RESUMEN SEMANAL</Text>
            </View>
            <Text style={s.title}>Tu semana en FreshList</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        {/* Stats grid */}
        <ReAnimated.View entering={FadeInDown.delay(100).duration(400)} style={s.mainCard}>
          <View style={s.grid}>
            {stats.map((st, i) => (
              <View key={i} style={[s.statBox, { backgroundColor: st.bg }]}>
                <st.Icon size={15} color={st.fg} strokeWidth={2} />
                <Text style={[s.statValue, { color: st.fg }]}>{st.v}</Text>
                <Text style={s.statLabel}>{st.l}</Text>
                {st.cmp !== '' && (
                  <Text style={[s.cmpBadge, { color: st.fg }]}>{st.cmp} vs anterior</Text>
                )}
              </View>
            ))}
          </View>

          {summary.favorite_meal && (
            <View style={s.favRow}>
              <Text style={s.favLabel}>Receta estrella</Text>
              <Text style={s.favMeal}>{summary.favorite_meal}</Text>
            </View>
          )}
        </ReAnimated.View>

        {/* AI Insight */}
        <ReAnimated.View entering={FadeInDown.delay(250).duration(400)} style={s.insightCard}>
          <View style={s.insightHeader}>
            <Sparkles size={16} color={colors.green600} strokeWidth={2} />
            <Text style={s.insightTitle}>Análisis IA</Text>
          </View>
          {loadingInsight ? (
            <ActivityIndicator size="small" color={colors.green600} style={{ marginVertical: 16 }} />
          ) : insight ? (
            <View style={s.insightContent}>
              <View style={s.insightBubble}>
                <Text style={s.insightText}>{insight.main_insight}</Text>
              </View>
              <View style={[s.insightBubble, { backgroundColor: colors.green50 }]}>
                <Text style={[s.insightLabel, { color: colors.green600 }]}>Consejo</Text>
                <Text style={s.insightText}>{insight.recommendation}</Text>
              </View>
              <View style={[s.insightBubble, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[s.insightLabel, { color: colors.amber400 }]}>Motivación</Text>
                <Text style={s.insightText}>{insight.encouragement}</Text>
              </View>
            </View>
          ) : (
            <Text style={s.noInsight}>No se pudo generar el análisis</Text>
          )}
        </ReAnimated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerBack: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  headerLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.amber400, letterSpacing: 0.8 },
  title: { fontSize: 18, fontFamily: fonts.black, color: colors.text, textAlign: 'center' },
  mainCard: { backgroundColor: colors.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statBox: { width: '47%', borderRadius: radius.lg, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 24, fontFamily: fonts.black, marginTop: 6 },
  statLabel: { fontSize: 10, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 2 },
  cmpBadge: { fontSize: 9, fontFamily: fonts.medium, marginTop: 4, opacity: 0.7 },
  favRow: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  favLabel: { fontSize: 10, fontFamily: fonts.bold, color: colors.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  favMeal: { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  insightCard: { backgroundColor: colors.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  insightTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  insightContent: { gap: 10 },
  insightBubble: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14 },
  insightLabel: { fontSize: 10, fontFamily: fonts.bold, letterSpacing: 0.5, marginBottom: 4 },
  insightText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSec, lineHeight: 20 },
  noInsight: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  backBtn: { backgroundColor: colors.green600, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 24 },
  backBtnText: { fontSize: 14, fontFamily: fonts.bold, color: 'white' },
});
