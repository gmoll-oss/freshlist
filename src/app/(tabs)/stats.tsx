import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, CookingPot, Trash2, TrendingUp, Leaf, Star, Share2, Flame, Heart, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

export default function StatsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        <View style={s.headerRow}>
          <Trophy size={15} color={colors.amber400} strokeWidth={2.2} />
          <Text style={s.headerLabel}>RESUMEN SEMANAL</Text>
        </View>
        <Text style={s.title}>Tu semana en FreshList</Text>

        <View style={s.mainCard}>
          <View style={s.grid}>
            {[
              { v: '5', l: 'Cenas cocinadas', fg: colors.green600, bg: colors.green50, Icon: CookingPot },
              { v: '0', l: 'Productos tirados', fg: colors.green600, bg: colors.green50, Icon: Trash2 },
              { v: '23€', l: 'Ahorrados', fg: colors.amber400, bg: '#FFFBEB', Icon: TrendingUp },
              { v: '+40%', l: 'Más verdura', fg: colors.green600, bg: colors.green50, Icon: Leaf },
            ].map((s2, i) => (
              <View key={i} style={[s.statBox, { backgroundColor: s2.bg }]}>
                <s2.Icon size={15} color={s2.fg} strokeWidth={2} />
                <Text style={[s.statValue, { color: s2.fg }]}>{s2.v}</Text>
                <Text style={s.statLabel}>{s2.l}</Text>
              </View>
            ))}
          </View>

          {/* Favorite */}
          <View style={s.favCard}>
            <Star size={18} color={colors.amber400} strokeWidth={2.2} />
            <View>
              <Text style={s.favTitle}>Favorita de la semana</Text>
              <Text style={s.favMeal}>Pollo Thai con Espinacas</Text>
            </View>
          </View>

          {/* Achievements */}
          <View style={s.achRow}>
            {[
              { Icon: Flame, l: '14 días', bg: colors.orange50, fg: colors.orange500 },
              { Icon: Leaf, l: 'Zero Waste', bg: colors.green50, fg: colors.green600 },
              { Icon: Heart, l: '+Verdura', bg: colors.red50, fg: colors.red400 },
            ].map((a, i) => (
              <View key={i} style={[s.achBox, { backgroundColor: a.bg }]}>
                <a.Icon size={18} color={a.fg} strokeWidth={2} />
                <Text style={[s.achLabel, { color: a.fg }]}>{a.l}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={s.shareBtn}>
          <Share2 size={16} color="white" strokeWidth={2.5} />
          <Text style={s.shareBtnText}>Compartir en Stories</Text>
        </TouchableOpacity>

        <View style={s.feedbackRow}>
          <TouchableOpacity style={s.feedBtn}>
            <ThumbsUp size={14} color={colors.green600} strokeWidth={2.2} />
            <Text style={s.feedText}>Buena semana</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.feedBtn}>
            <ThumbsDown size={14} color={colors.textMuted} strokeWidth={2.2} />
            <Text style={s.feedText}>Mejorable</Text>
          </TouchableOpacity>
        </View>

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
  favCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  favTitle: { fontSize: 12, fontFamily: fonts.bold, color: colors.text },
  favMeal: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.regular },
  achRow: { flexDirection: 'row', gap: 8 },
  achBox: { flex: 1, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  achLabel: { fontSize: 9, fontFamily: fonts.medium, marginTop: 4 },
  shareBtn: { backgroundColor: colors.green600, borderRadius: radius.lg, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  shareBtnText: { fontSize: 14, fontFamily: fonts.bold, color: 'white' },
  feedbackRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  feedBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: 11, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  feedText: { fontSize: 12, fontFamily: fonts.medium, color: colors.textSec },
});
