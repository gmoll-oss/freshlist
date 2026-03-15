import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Share, RefreshControl } from 'react-native';
import { Alert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Trophy, CookingPot, Trash2, TrendingUp, Leaf, Star, Share2, Flame, Heart, ThumbsUp, ThumbsDown, BarChart3, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { Skeleton, SkeletonGrid } from '../../components/ui/Skeleton';
import { fetchUserStats } from '../../services/supabase/stats';
import { saveFeedback } from '../../services/supabase/feedback';
import type { UserStats } from '../../types';

export default function StatsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchUserStats();
      setStats(data);
    } catch (_) {
      setStats({
        current_streak: 0, longest_streak: 0, total_saved_euros: 0,
        total_products_saved: 0, total_products_thrown: 0, total_recipes_cooked: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  function onRefresh() {
    setRefreshing(true);
    loadStats();
  }

  if (loading || !stats) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ padding: spacing.lg, gap: 16, alignItems: 'center' }}>
          <Skeleton width="40%" height={14} borderRadius={8} />
          <Skeleton width="60%" height={22} borderRadius={8} />
          <View style={{ width: '100%', backgroundColor: colors.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border }}>
            <SkeletonGrid />
          </View>
          <Skeleton width="100%" height={50} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  const isAllZero = stats.total_recipes_cooked === 0 && stats.total_products_saved === 0 && stats.total_saved_euros === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ padding: spacing.lg }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green600} />}>
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <View style={s.headerRow}>
            <Trophy size={15} color={colors.amber400} strokeWidth={2.2} />
            <Text style={s.headerLabel}>TUS LOGROS</Text>
          </View>
          <Text style={s.title}>Tu progreso en FreshList</Text>
        </Animated.View>

        {isAllZero && (
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={s.emptyBanner}>
            <Sparkles size={20} color={colors.green600} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={s.emptyBannerTitle}>Empieza tu primera receta</Text>
              <Text style={s.emptyBannerSub}>Escanea un ticket, genera un plan y cocina para ver tus estadisticas aqui</Text>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.mainCard}>
          <View style={s.grid}>
            {[
              { v: String(stats.total_recipes_cooked), l: 'Cenas cocinadas', fg: colors.green600, bg: colors.green50, Icon: CookingPot },
              { v: String(stats.total_products_thrown), l: 'Productos tirados', fg: stats.total_products_thrown === 0 ? colors.green600 : colors.red400, bg: stats.total_products_thrown === 0 ? colors.green50 : colors.red50, Icon: Trash2 },
              { v: `${stats.total_saved_euros}€`, l: 'Ahorrados', fg: colors.amber400, bg: '#FFFBEB', Icon: TrendingUp },
              { v: String(stats.total_products_saved), l: 'Productos usados', fg: colors.green600, bg: colors.green50, Icon: Leaf },
            ].map((s2, i) => (
              <View key={i} style={[s.statBox, { backgroundColor: s2.bg }]}>
                <s2.Icon size={15} color={s2.fg} strokeWidth={2} />
                <Text style={[s.statValue, { color: s2.fg }]}>{s2.v}</Text>
                <Text style={s.statLabel}>{s2.l}</Text>
              </View>
            ))}
          </View>

          {/* Achievements */}
          <View style={s.achRow}>
            {[
              { Icon: Flame, l: `${stats.current_streak}d racha`, bg: colors.orange50, fg: colors.orange500 },
              { Icon: Star, l: `Mejor: ${stats.longest_streak}d`, bg: colors.green50, fg: colors.green600 },
              { Icon: Heart, l: `${stats.total_products_saved} salvados`, bg: colors.red50, fg: colors.red400 },
            ].map((a, i) => (
              <View key={i} style={[s.achBox, { backgroundColor: a.bg }]}>
                <a.Icon size={18} color={a.fg} strokeWidth={2} />
                <Text style={[s.achLabel, { color: a.fg }]}>{a.l}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
        <TouchableOpacity style={s.shareBtn} onPress={async () => {
          try {
            await Share.share({
              message: `Mi semana en FreshList: ${stats.total_recipes_cooked} recetas cocinadas, ${stats.total_saved_euros}€ ahorrados, racha de ${stats.current_streak} dias sin tirar comida`,
            });
          } catch (_) {}
        }}>
          <Share2 size={16} color="white" strokeWidth={2.5} />
          <Text style={s.shareBtnText}>Compartir en Stories</Text>
        </TouchableOpacity>

        <View style={s.feedbackRow}>
          <TouchableOpacity style={s.feedBtn} onPress={async () => {
            try {
              await saveFeedback('buena');
              Alert.alert('Genial, sigue asi!');
            } catch (_) {}
          }}>
            <ThumbsUp size={14} color={colors.green600} strokeWidth={2.2} />
            <Text style={s.feedText}>Buena semana</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.feedBtn} onPress={async () => {
            try {
              await saveFeedback('mejorable');
              router.push('/chat' as any);
            } catch (_) {}
          }}>
            <ThumbsDown size={14} color={colors.textMuted} strokeWidth={2.2} />
            <Text style={s.feedText}>Mejorable</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.summaryBtn} onPress={() => router.push('/weekly-summary')}>
          <BarChart3 size={16} color={colors.green600} strokeWidth={2} />
          <Text style={s.summaryBtnText}>Ver resumen semanal</Text>
        </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, marginBottom: 6 },
  headerLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.amber400, letterSpacing: 0.8 },
  title: { fontSize: 20, fontFamily: fonts.black, color: colors.text, textAlign: 'center', marginBottom: 16 },
  mainCard: { backgroundColor: colors.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statBox: { width: '47%', borderRadius: radius.lg, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 24, fontFamily: fonts.black, marginTop: 6 },
  statLabel: { fontSize: 10, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 2 },
  achRow: { flexDirection: 'row', gap: 8 },
  achBox: { flex: 1, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  achLabel: { fontSize: 9, fontFamily: fonts.medium, marginTop: 4 },
  shareBtn: { backgroundColor: colors.green600, borderRadius: radius.lg, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  shareBtnText: { fontSize: 14, fontFamily: fonts.bold, color: 'white' },
  feedbackRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  feedBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: 11, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  feedText: { fontSize: 12, fontFamily: fonts.medium, color: colors.textSec },
  summaryBtn: { marginTop: 10, backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border },
  summaryBtnText: { fontSize: 14, fontFamily: fonts.bold, color: colors.green600 },
  emptyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.green50, borderRadius: radius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.green200, marginBottom: 16,
  },
  emptyBannerTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.green700 },
  emptyBannerSub: { fontSize: 11, fontFamily: fonts.regular, color: colors.green600, marginTop: 2 },
});
