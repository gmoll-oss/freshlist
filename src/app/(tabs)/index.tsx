import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Flame, CookingPot, ChefHat, Timer, UtensilsCrossed, ChevronRight, AlertTriangle, Receipt, Package, Sparkles, ScanLine, MessageCircle, ArrowRight } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useHomeData } from '../../hooks/useHomeData';
import { setCurrentMeal } from '../../services/mealPlan/mealPlanStore';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 7) return 'Buenas noches';
  if (h < 13) return 'Buenos dias';
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
  const { stats, todayMeal, expiringItems, pantryCount, expiringSoonCount, loading, load } = useHomeData();

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
          <TouchableOpacity style={s.avatar} onPress={() => router.push('/profile')}>
            <Text style={s.avatarText}>{initial}</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Alerta urgente — lo mas importante */}
        {expiringItems.length > 0 && (
          <View style={s.urgentCard}>
            <View style={s.urgentTag}>
              <AlertTriangle size={13} color={colors.red500} strokeWidth={2.5} />
              <Text style={s.urgentTagText}>USAR HOY</Text>
            </View>
            <View style={s.urgentRow}>
              {expiringItems.slice(0, 3).map((p, i) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expiry = new Date(p.estimated_expiry);
                expiry.setHours(0, 0, 0, 0);
                const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const label = diff <= 0 ? 'Caduca hoy' : 'Manana';
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

        {/* 2. Resumen despensa */}
        <TouchableOpacity style={s.pantryCard} onPress={() => router.push('/(tabs)/pantry' as any)}>
          <View style={s.pantryIcon}>
            <Package size={18} color={colors.green600} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.pantryTitle}>{pantryCount} productos en despensa</Text>
            {expiringSoonCount > 0 && (
              <Text style={s.pantryWarn}>{expiringSoonCount} caducan en 3 dias</Text>
            )}
          </View>
          <ChevronRight size={16} color={colors.textDim} />
        </TouchableOpacity>

        {/* 3. Receta del dia — compacta */}
        {todayMeal ? (
          <TouchableOpacity
            style={s.mealCard}
            onPress={todayMeal.cooked ? () => router.push('/plan') : handleCookToday}
          >
            <View style={s.mealLeft}>
              <View style={s.mealTag}>
                <CookingPot size={12} color={colors.green600} strokeWidth={2.5} />
                <Text style={s.mealTagText}>HOY</Text>
              </View>
              <Text style={s.mealName} numberOfLines={1}>{todayMeal.meal_name}</Text>
              <View style={s.mealMeta}>
                <Timer size={11} color={colors.textMuted} strokeWidth={2} />
                <Text style={s.mealMetaText}>{todayMeal.prep_time_minutes} min</Text>
                <UtensilsCrossed size={11} color={colors.textMuted} strokeWidth={2} />
                <Text style={s.mealMetaText}>{todayMeal.servings} pers</Text>
              </View>
            </View>
            {!todayMeal.cooked ? (
              <View style={s.mealCookBtn}>
                <ChefHat size={16} color="white" strokeWidth={2.5} />
              </View>
            ) : (
              <View style={s.mealDoneBtn}>
                <Text style={s.mealDoneText}>Hecho</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.mealCard} onPress={() => router.push('/plan')}>
            <View style={s.mealLeft}>
              <View style={s.mealTag}>
                <Sparkles size={12} color={colors.green600} strokeWidth={2.5} />
                <Text style={s.mealTagText}>PLAN</Text>
              </View>
              <Text style={s.mealName}>Sin plan esta semana</Text>
              <Text style={s.mealSub}>Genera uno basado en tu despensa</Text>
            </View>
            <ChevronRight size={18} color={colors.green600} />
          </TouchableOpacity>
        )}

        {/* 4. Quick actions */}
        <View style={s.quickRow}>
          {[
            { Icon: Receipt, label: 'Escanear ticket', bg: colors.green50, fg: colors.green600, route: '/(tabs)/scan' },
            { Icon: ScanLine, label: 'Foto nevera', bg: colors.violet50, fg: colors.violet400, route: '/(tabs)/scan' },
            { Icon: CookingPot, label: 'Ver plan', bg: colors.orange50, fg: colors.orange500, route: '/plan' },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={[s.quickBtn, { backgroundColor: a.bg }]}
              onPress={() => router.push(a.route as any)}>
              <a.Icon size={20} color={a.fg} strokeWidth={1.8} />
              <Text style={[s.quickLabel, { color: a.fg }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 5. Racha — motivacional al final */}
        <View style={s.streakCard}>
          <View style={s.streakLeft}>
            <View style={s.streakIcon}>
              <Flame size={20} color={colors.orange500} strokeWidth={2.2} />
            </View>
            <View>
              <Text style={s.streakNum}>{stats.current_streak} {stats.current_streak === 1 ? 'dia' : 'dias'}</Text>
              <Text style={s.streakLabel}>sin tirar comida</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.savedNum}>{stats.total_saved_euros}€</Text>
            <Text style={s.savedLabel}>ahorrados</Text>
          </View>
        </View>

        {/* Autopilot banner */}
        {!todayMeal && (
          <TouchableOpacity style={s.autopilotBanner} onPress={() => router.push('/autopilot' as any)}>
            <Sparkles size={18} color={colors.green600} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={s.autopilotTitle}>Semana complicada?</Text>
              <Text style={s.autopilotSub}>Deja que FreshList se ocupe</Text>
            </View>
            <ArrowRight size={16} color={colors.green600} strokeWidth={2} />
          </TouchableOpacity>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Chat FAB */}
      <TouchableOpacity style={s.fab} onPress={() => router.push('/chat' as any)}>
        <MessageCircle size={24} color="white" strokeWidth={2} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.medium },
  name: { fontSize: 22, fontFamily: fonts.black, color: colors.text, marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.green500, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontFamily: fonts.bold, fontSize: 15 },

  // Urgent alert
  urgentCard: { backgroundColor: colors.red50, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.red100, marginBottom: spacing.md },
  urgentTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  urgentTagText: { fontSize: 11, fontFamily: fonts.bold, color: colors.red500 },
  urgentRow: { flexDirection: 'row', gap: 8 },
  urgentItem: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.red100 },
  urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red400 },
  urgentName: { fontSize: 12, fontFamily: fonts.bold, color: colors.text },
  urgentDays: { fontSize: 10, color: colors.red400, fontFamily: fonts.regular },

  // Pantry summary
  pantryCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md,
  },
  pantryIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.green50, justifyContent: 'center', alignItems: 'center' },
  pantryTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  pantryWarn: { fontSize: 11, color: colors.orange500, fontFamily: fonts.medium, marginTop: 2 },

  // Compact meal card
  mealCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md,
  },
  mealLeft: { flex: 1 },
  mealTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  mealTagText: { fontSize: 10, fontFamily: fonts.bold, color: colors.green600, letterSpacing: 0.6 },
  mealName: { fontSize: 15, fontFamily: fonts.bold, color: colors.text, marginBottom: 4 },
  mealSub: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.regular },
  mealMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mealMetaText: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.regular, marginRight: 8 },
  mealCookBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.green600, justifyContent: 'center', alignItems: 'center' },
  mealDoneBtn: { backgroundColor: colors.green50, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  mealDoneText: { fontSize: 11, fontFamily: fonts.bold, color: colors.green600 },

  // Quick actions
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  quickBtn: { flex: 1, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
  quickLabel: { fontSize: 10, fontFamily: fonts.medium, marginTop: 4, textAlign: 'center' },

  // Streak
  streakCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.orange50, justifyContent: 'center', alignItems: 'center' },
  streakNum: { fontSize: 16, fontFamily: fonts.black, color: colors.text },
  streakLabel: { fontSize: 10, color: colors.textMuted, fontFamily: fonts.regular },
  savedNum: { fontSize: 15, fontFamily: fonts.bold, color: colors.green600 },
  savedLabel: { fontSize: 10, color: colors.textMuted, fontFamily: fonts.regular },

  // Autopilot banner
  autopilotBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.green50, borderRadius: radius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.green200, marginTop: spacing.md,
  },
  autopilotTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.green700 },
  autopilotSub: { fontSize: 11, fontFamily: fonts.regular, color: colors.green600 },

  // Chat FAB
  fab: {
    position: 'absolute', bottom: 100, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.green600,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8,
    elevation: 6,
  },
});
