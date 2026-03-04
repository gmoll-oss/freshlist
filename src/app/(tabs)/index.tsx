import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Leaf, Bell, Flame, CookingPot, ChefHat, Timer, UtensilsCrossed, Star, ChevronRight, AlertTriangle, Receipt, Package, Sparkles } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useHomeData } from '../../hooks/useHomeData';
import { setCurrentMeal } from '../../services/mealPlan/mealPlanStore';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 7) return 'Buenas noches';
  if (h < 13) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function getUserName(user: any): string {
  if (!user) return 'Chef';
  const meta = user.user_metadata;
  if (meta?.full_name) return meta.full_name.split(' ')[0];
  if (meta?.name) return meta.name.split(' ')[0];
  if (user.email) return user.email.split('@')[0];
  return 'Chef';
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { stats, todayMeal, expiringItems, loading, load } = useHomeData();

  useEffect(() => { load(); }, [load]);

  const name = getUserName(user);
  const initial = name.charAt(0).toUpperCase();

  function handleCookToday() {
    if (todayMeal) {
      setCurrentMeal(todayMeal);
      router.push(`/cook/${todayMeal.id}`);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{getGreeting()}</Text>
            <Text style={s.name}>{name}</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.avatar} onPress={() => router.push('/profile')}>
              <Text style={s.avatarText}>{initial}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Streak */}
        <View style={s.streakCard}>
          <View style={s.streakLeft}>
            <View style={s.streakIcon}>
              <Flame size={22} color={colors.orange500} strokeWidth={2.2} />
            </View>
            <View>
              <Text style={s.streakNum}>{stats.current_streak} {stats.current_streak === 1 ? 'día' : 'dias'}</Text>
              <Text style={s.streakLabel}>sin tirar comida</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.savedNum}>{stats.total_saved_euros}€</Text>
            <Text style={s.savedLabel}>ahorrados</Text>
          </View>
        </View>

        {/* Hero: Cena de hoy */}
        {todayMeal ? (
          <View style={s.heroCard}>
            <View style={s.heroTag}>
              <CookingPot size={14} color={colors.green600} strokeWidth={2.5} />
              <Text style={s.heroTagText}>TU CENA DE HOY</Text>
            </View>
            <Text style={s.heroTitle}>{todayMeal.meal_name}</Text>
            {todayMeal.batch_note && (
              <Text style={s.heroSub}>{todayMeal.batch_note}</Text>
            )}

            <View style={s.heroMeta}>
              {[
                { v: `${todayMeal.prep_time_minutes} min`, l: 'Tiempo', Icon: Timer },
                { v: `${todayMeal.servings} pers`, l: 'Raciones', Icon: UtensilsCrossed },
              ].map((item, i) => (
                <View key={i} style={s.metaItem}>
                  <item.Icon size={13} color={colors.green600} strokeWidth={2.2} />
                  <View>
                    <Text style={s.metaValue}>{item.v}</Text>
                    <Text style={s.metaLabel}>{item.l}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={s.heroActions}>
              {!todayMeal.cooked ? (
                <TouchableOpacity style={s.cookBtn} onPress={handleCookToday}>
                  <ChefHat size={16} color="white" strokeWidth={2.5} />
                  <Text style={s.cookBtnText}>Cocinar ahora</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.cookedTag}>
                  <Star size={14} color={colors.green600} strokeWidth={2.2} />
                  <Text style={s.cookedText}>Ya cocinada</Text>
                </View>
              )}
              <TouchableOpacity style={s.moreBtn} onPress={() => router.push('/plan')}>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={s.heroCard}>
            <View style={s.heroTag}>
              <CookingPot size={14} color={colors.green600} strokeWidth={2.5} />
              <Text style={s.heroTagText}>PLAN DE COMIDAS</Text>
            </View>
            <Text style={s.heroTitle}>Sin plan esta semana</Text>
            <Text style={s.heroSub}>Genera un plan personalizado basado en tu despensa</Text>
            <TouchableOpacity style={s.cookBtn} onPress={() => router.push('/plan')}>
              <Sparkles size={16} color="white" strokeWidth={2.5} />
              <Text style={s.cookBtnText}>Generar plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Alerta urgente */}
        {expiringItems.length > 0 && (
          <View style={s.urgentCard}>
            <View style={s.urgentTag}>
              <AlertTriangle size={13} color={colors.red500} strokeWidth={2.5} />
              <Text style={s.urgentTagText}>USAR HOY</Text>
            </View>
            <View style={s.urgentRow}>
              {expiringItems.slice(0, 2).map((p, i) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expiry = new Date(p.estimated_expiry);
                expiry.setHours(0, 0, 0, 0);
                const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const label = diff <= 0 ? 'Caduca hoy' : 'Mañana';
                return (
                  <View key={i} style={s.urgentItem}>
                    <View style={s.urgentDot} />
                    <View>
                      <Text style={s.urgentName}>{p.name}</Text>
                      <Text style={s.urgentDays}>{label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick actions */}
        <View style={s.quickRow}>
          {[
            { Icon: Receipt, label: 'Ticket', bg: colors.green50, fg: colors.green600, route: '/(tabs)/scan' },
            { Icon: Leaf, label: 'Nevera', bg: colors.violet50, fg: colors.violet400, route: '/(tabs)/scan' },
            { Icon: Package, label: 'Despensa', bg: colors.orange50, fg: colors.orange500, route: '/(tabs)/pantry' },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={[s.quickBtn, { backgroundColor: a.bg }]}
              onPress={() => router.push(a.route as any)}>
              <a.Icon size={20} color={a.fg} strokeWidth={1.8} />
              <Text style={[s.quickLabel, { color: a.fg }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.medium },
  name: { fontSize: 22, fontFamily: fonts.black, color: colors.text, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.green500, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontFamily: fonts.bold, fontSize: 15 },
  streakCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.orange50, justifyContent: 'center', alignItems: 'center' },
  streakNum: { fontSize: 18, fontFamily: fonts.black, color: colors.text },
  streakLabel: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.regular },
  savedNum: { fontSize: 17, fontFamily: fonts.bold, color: colors.green600 },
  savedLabel: { fontSize: 10, color: colors.textMuted, fontFamily: fonts.regular },
  heroCard: { backgroundColor: colors.card, borderRadius: 24, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  heroTagText: { fontSize: 11, fontFamily: fonts.bold, color: colors.green600, letterSpacing: 0.8 },
  heroTitle: { fontSize: 21, fontFamily: fonts.black, color: colors.text, marginBottom: 4, lineHeight: 26 },
  heroSub: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.regular, marginBottom: 14 },
  heroMeta: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaValue: { fontSize: 13, fontFamily: fonts.bold, color: colors.text },
  metaLabel: { fontSize: 9, color: colors.textMuted, fontFamily: fonts.regular },
  heroActions: { flexDirection: 'row', gap: 8 },
  cookBtn: { flex: 1, backgroundColor: colors.green600, borderRadius: radius.md, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  cookBtnText: { fontSize: 14, fontFamily: fonts.bold, color: 'white' },
  cookedTag: { flex: 1, backgroundColor: colors.green50, borderRadius: radius.md, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  cookedText: { fontSize: 14, fontFamily: fonts.bold, color: colors.green600 },
  moreBtn: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  urgentCard: { backgroundColor: colors.red50, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.red100, marginBottom: spacing.md },
  urgentTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  urgentTagText: { fontSize: 11, fontFamily: fonts.bold, color: colors.red500 },
  urgentRow: { flexDirection: 'row', gap: 8 },
  urgentItem: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.red100 },
  urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red400 },
  urgentName: { fontSize: 12, fontFamily: fonts.bold, color: colors.text },
  urgentDays: { fontSize: 10, color: colors.red400, fontFamily: fonts.regular },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickBtn: { flex: 1, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
  quickLabel: { fontSize: 11, fontFamily: fonts.medium, marginTop: 4 },
});
