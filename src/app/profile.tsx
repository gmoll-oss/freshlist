import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ChevronLeft, LogOut, Users, UtensilsCrossed, Leaf, AlertTriangle, Timer, Target } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { usePreferences } from '../hooks/usePreferences';
import { useAuth } from '../hooks/useAuth';

const COOKING_LABELS: Record<string, string> = {
  rapido: 'Rapido (< 15 min)',
  normal: 'Normal (15–30 min)',
  sin_prisa: 'Sin prisa (> 30 min)',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { preferences, loading, load } = usePreferences();

  useEffect(() => { load(); }, [load]);

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.green600} />
      </SafeAreaView>
    );
  }

  const mealsLabel = [
    preferences.meals_config.breakfast && 'Desayuno',
    preferences.meals_config.lunch && 'Comida',
    preferences.meals_config.dinner && 'Cena',
  ].filter(Boolean).join(' + ');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, gap: 12 }}>
        {/* Avatar + Name */}
        <View style={s.nameCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {preferences.display_name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={s.displayName}>{preferences.display_name ?? 'Sin nombre'}</Text>
        </View>

        <TouchableOpacity style={s.card} onPress={() => router.push('/onboarding')}>
          <View style={[s.cardIcon, { backgroundColor: colors.green50 }]}>
            <Users size={18} color={colors.green600} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Comensales</Text>
            <Text style={s.cardValue}>{preferences.people_count} personas</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => router.push('/onboarding')}>
          <View style={[s.cardIcon, { backgroundColor: colors.orange50 }]}>
            <UtensilsCrossed size={18} color={colors.orange500} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Comidas</Text>
            <Text style={s.cardValue}>{mealsLabel || 'Ninguna'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => router.push('/onboarding')}>
          <View style={[s.cardIcon, { backgroundColor: colors.green50 }]}>
            <Leaf size={18} color={colors.green600} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Dieta</Text>
            <Text style={s.cardValue}>{preferences.diet_type.join(', ')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => router.push('/onboarding')}>
          <View style={[s.cardIcon, { backgroundColor: colors.orange50 }]}>
            <Timer size={18} color={colors.orange500} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Tiempo de cocina</Text>
            <Text style={s.cardValue}>{COOKING_LABELS[preferences.cooking_time] ?? preferences.cooking_time}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => router.push('/onboarding')}>
          <View style={[s.cardIcon, { backgroundColor: colors.violet50 }]}>
            <Target size={18} color={colors.violet400} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Objetivo</Text>
            <Text style={s.cardValue}>{preferences.health_goal ?? 'Sin objetivo'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => router.push('/onboarding')}>
          <View style={[s.cardIcon, { backgroundColor: colors.red50 }]}>
            <AlertTriangle size={18} color={colors.red500} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Intolerancias</Text>
            <Text style={s.cardValue}>
              {preferences.intolerances.length > 0 ? preferences.intolerances.join(', ') : 'Ninguna'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleSignOut}>
          <LogOut size={18} color={colors.red500} strokeWidth={2} />
          <Text style={s.logoutText}>Cerrar sesion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.text },
  nameCard: { alignItems: 'center', paddingVertical: spacing.lg, gap: 10 },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.green500,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: 'white', fontFamily: fonts.bold, fontSize: 24 },
  displayName: { fontSize: 20, fontFamily: fonts.black, color: colors.text },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 16,
    borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  cardIcon: { width: 40, height: 40, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  cardLabel: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.medium },
  cardValue: { fontSize: 15, fontFamily: fonts.bold, color: colors.text, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, marginTop: 12, backgroundColor: colors.red50,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.red100,
  },
  logoutText: { fontSize: 15, fontFamily: fonts.bold, color: colors.red500 },
});
