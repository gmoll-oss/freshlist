import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Alert } from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ChevronLeft, LogOut, Users, UtensilsCrossed, Leaf, AlertTriangle, Timer, Target, Heart, Moon, History, Crown, Bell, X, Check, Minus, Plus, PlayCircle } from 'lucide-react-native';
import Haptics from '../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { usePreferences } from '../hooks/usePreferences';
import { useAuth } from '../hooks/useAuth';
import { useTheme, ThemeMode } from '../hooks/useTheme';

const COOKING_LABELS: Record<string, string> = {
  rapido: 'Rapido (< 15 min)',
  normal: 'Normal (15–30 min)',
  sin_prisa: 'Sin prisa (> 30 min)',
};

const DIET_OPTIONS = [
  'Sin restricciones', 'Omnivoro', 'Vegetariano', 'Vegano', 'Pescetariano', 'Sin gluten', 'Keto',
];

const INTOLERANCE_OPTIONS = [
  'Lactosa', 'Gluten', 'Frutos secos', 'Marisco', 'Huevo', 'Soja',
];

const COOKING_OPTIONS = [
  { value: 'rapido', label: 'Rapido', desc: 'Menos de 15 min' },
  { value: 'normal', label: 'Normal', desc: '15–30 min' },
  { value: 'sin_prisa', label: 'Sin prisa', desc: 'Mas de 30 min' },
];

const HEALTH_GOALS = [
  'Sin objetivo', 'Perder peso', 'Ganar masa muscular', 'Menos hidratos', 'Comer equilibrado',
];

type EditField = 'name' | 'people' | 'meals' | 'diet' | 'cooking' | 'goal' | 'intolerances' | null;

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { preferences, loading, load, save } = usePreferences();
  const { mode, setMode } = useTheme();
  const [editField, setEditField] = useState<EditField>(null);
  const [tempName, setTempName] = useState('');
  const [tempPeople, setTempPeople] = useState(2);
  const [tempMeals, setTempMeals] = useState({ breakfast: false, lunch: false, dinner: true });
  const [tempDiet, setTempDiet] = useState<string[]>([]);
  const [tempCooking, setTempCooking] = useState('normal');
  const [tempGoal, setTempGoal] = useState<string | null>(null);
  const [tempIntolerances, setTempIntolerances] = useState<string[]>([]);

  const THEME_LABELS: Record<ThemeMode, string> = { auto: 'Auto', light: 'Claro', dark: 'Oscuro' };
  const nextTheme: Record<ThemeMode, ThemeMode> = { auto: 'light', light: 'dark', dark: 'auto' };

  useEffect(() => { load(); }, [load]);

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  function openEdit(field: EditField) {
    setTempName(preferences.display_name ?? '');
    setTempPeople(preferences.people_count);
    setTempMeals({ ...preferences.meals_config });
    setTempDiet([...preferences.diet_type]);
    setTempCooking(preferences.cooking_time);
    setTempGoal(preferences.health_goal);
    setTempIntolerances([...preferences.intolerances]);
    setEditField(field);
  }

  async function saveField() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      switch (editField) {
        case 'name': await save({ display_name: tempName.trim() || null }); break;
        case 'people': await save({ people_count: tempPeople }); break;
        case 'meals': await save({ meals_config: tempMeals }); break;
        case 'diet': await save({ diet_type: tempDiet }); break;
        case 'cooking': await save({ cooking_time: tempCooking as any }); break;
        case 'goal': await save({ health_goal: tempGoal === 'Sin objetivo' ? null : tempGoal }); break;
        case 'intolerances': await save({ intolerances: tempIntolerances }); break;
      }
    } catch { Alert.alert('Error', 'No se pudo guardar'); }
    setEditField(null);
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

  function renderModalContent() {
    switch (editField) {
      case 'name':
        return (
          <View style={ms.body}>
            <Text style={ms.label}>Tu nombre</Text>
            <TextInput style={ms.input} value={tempName} onChangeText={setTempName} placeholder="Nombre" autoFocus />
          </View>
        );
      case 'people':
        return (
          <View style={ms.body}>
            <Text style={ms.label}>Numero de comensales</Text>
            <View style={ms.counterRow}>
              <TouchableOpacity style={ms.counterBtn} onPress={() => setTempPeople(Math.max(1, tempPeople - 1))}>
                <Minus size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={ms.counterValue}>{tempPeople}</Text>
              <TouchableOpacity style={ms.counterBtn} onPress={() => setTempPeople(Math.min(10, tempPeople + 1))}>
                <Plus size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'meals':
        return (
          <View style={ms.body}>
            <Text style={ms.label}>Que comidas planificas?</Text>
            {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => {
              const labels = { breakfast: 'Desayuno', lunch: 'Comida', dinner: 'Cena' };
              const active = tempMeals[meal];
              return (
                <TouchableOpacity key={meal} style={[ms.option, active && ms.optionActive]} onPress={() => setTempMeals((p) => ({ ...p, [meal]: !p[meal] }))}>
                  <Text style={[ms.optionText, active && ms.optionTextActive]}>{labels[meal]}</Text>
                  {active && <Check size={16} color={colors.green600} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case 'diet':
        return (
          <View style={ms.body}>
            <Text style={ms.label}>Tipo de dieta</Text>
            {DIET_OPTIONS.map((d) => {
              const active = tempDiet.includes(d);
              return (
                <TouchableOpacity key={d} style={[ms.option, active && ms.optionActive]} onPress={() => {
                  if (d === 'Sin restricciones') { setTempDiet(['Sin restricciones']); }
                  else { setTempDiet((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p.filter((x) => x !== 'Sin restricciones'), d]); }
                }}>
                  <Text style={[ms.optionText, active && ms.optionTextActive]}>{d}</Text>
                  {active && <Check size={16} color={colors.green600} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case 'cooking':
        return (
          <View style={ms.body}>
            <Text style={ms.label}>Tiempo de cocina</Text>
            {COOKING_OPTIONS.map((o) => {
              const active = tempCooking === o.value;
              return (
                <TouchableOpacity key={o.value} style={[ms.option, active && ms.optionActive]} onPress={() => setTempCooking(o.value)}>
                  <View>
                    <Text style={[ms.optionText, active && ms.optionTextActive]}>{o.label}</Text>
                    <Text style={ms.optionDesc}>{o.desc}</Text>
                  </View>
                  {active && <Check size={16} color={colors.green600} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case 'goal':
        return (
          <View style={ms.body}>
            <Text style={ms.label}>Objetivo de salud</Text>
            {HEALTH_GOALS.map((g) => {
              const active = (g === 'Sin objetivo' && !tempGoal) || tempGoal === g;
              return (
                <TouchableOpacity key={g} style={[ms.option, active && ms.optionActive]} onPress={() => setTempGoal(g === 'Sin objetivo' ? null : g)}>
                  <Text style={[ms.optionText, active && ms.optionTextActive]}>{g}</Text>
                  {active && <Check size={16} color={colors.green600} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case 'intolerances':
        return (
          <View style={ms.body}>
            <Text style={ms.label}>Intolerancias</Text>
            {INTOLERANCE_OPTIONS.map((i) => {
              const active = tempIntolerances.includes(i);
              return (
                <TouchableOpacity key={i} style={[ms.option, active && ms.optionActive]} onPress={() => setTempIntolerances((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i])}>
                  <Text style={[ms.optionText, active && ms.optionTextActive]}>{i}</Text>
                  {active && <Check size={16} color={colors.green600} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      default: return null;
    }
  }

  const modalTitles: Record<string, string> = {
    name: 'Nombre', people: 'Comensales', meals: 'Comidas', diet: 'Dieta',
    cooking: 'Tiempo de cocina', goal: 'Objetivo', intolerances: 'Intolerancias',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, gap: 12, paddingBottom: 40 }} showsVerticalScrollIndicator bounces alwaysBounceVertical>
        {/* Avatar + Name */}
        <TouchableOpacity style={s.nameCard} onPress={() => openEdit('name')}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {preferences.display_name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={s.displayName}>{preferences.display_name ?? 'Sin nombre'}</Text>
          <Text style={{ fontSize: 11, fontFamily: fonts.regular, color: colors.textMuted }}>Toca para cambiar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => openEdit('people')}>
          <View style={[s.cardIcon, { backgroundColor: colors.green50 }]}>
            <Users size={18} color={colors.green600} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Comensales</Text>
            <Text style={s.cardValue}>{preferences.people_count} personas</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => openEdit('meals')}>
          <View style={[s.cardIcon, { backgroundColor: colors.orange50 }]}>
            <UtensilsCrossed size={18} color={colors.orange500} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Comidas</Text>
            <Text style={s.cardValue}>{mealsLabel || 'Ninguna'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => openEdit('diet')}>
          <View style={[s.cardIcon, { backgroundColor: colors.green50 }]}>
            <Leaf size={18} color={colors.green600} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Dieta</Text>
            <Text style={s.cardValue}>{preferences.diet_type.join(', ')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => openEdit('cooking')}>
          <View style={[s.cardIcon, { backgroundColor: colors.orange50 }]}>
            <Timer size={18} color={colors.orange500} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Tiempo de cocina</Text>
            <Text style={s.cardValue}>{COOKING_LABELS[preferences.cooking_time] ?? preferences.cooking_time}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => openEdit('goal')}>
          <View style={[s.cardIcon, { backgroundColor: colors.violet50 }]}>
            <Target size={18} color={colors.violet400} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Objetivo</Text>
            <Text style={s.cardValue}>{preferences.health_goal ?? 'Sin objetivo'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => openEdit('intolerances')}>
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

        <TouchableOpacity style={s.card} onPress={() => setMode(nextTheme[mode])}>
          <View style={[s.cardIcon, { backgroundColor: colors.violet50 }]}>
            <Moon size={18} color={colors.violet400} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Tema</Text>
            <Text style={s.cardValue}>{THEME_LABELS[mode]}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => router.push('/favorites' as any)}>
          <View style={[s.cardIcon, { backgroundColor: colors.red50 }]}>
            <Heart size={18} color={colors.red400} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Recetas</Text>
            <Text style={s.cardValue}>Mis recetas favoritas</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => router.push('/notification-settings' as any)}>
          <View style={[s.cardIcon, { backgroundColor: colors.green50 }]}>
            <Bell size={18} color={colors.green600} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Notificaciones</Text>
            <Text style={s.cardValue}>Configurar alertas</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => router.push('/scan-history' as any)}>
          <View style={[s.cardIcon, { backgroundColor: colors.orange50 }]}>
            <History size={18} color={colors.orange500} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Escaneos</Text>
            <Text style={s.cardValue}>Historial de escaneos</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={() => router.push('/family' as any)}>
          <View style={[s.cardIcon, { backgroundColor: colors.violet50 }]}>
            <Users size={18} color={colors.violet400} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Hogar</Text>
            <Text style={s.cardValue}>Compartir en familia</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.card} onPress={async () => {
          await AsyncStorage.removeItem('welcome_seen');
          router.push('/welcome' as any);
        }}>
          <View style={[s.cardIcon, { backgroundColor: colors.green50 }]}>
            <PlayCircle size={18} color={colors.green600} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Tutorial</Text>
            <Text style={s.cardValue}>Ver presentacion</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.premiumCard} onPress={() => router.push('/paywall' as any)}>
          <View style={[s.cardIcon, { backgroundColor: '#FFFBEB' }]}>
            <Crown size={18} color={colors.amber400} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardLabel}>Suscripcion</Text>
            <Text style={[s.cardValue, { color: colors.amber400 }]}>FreshList Premium</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.logoutBtn} onPress={handleSignOut}>
          <LogOut size={18} color={colors.red500} strokeWidth={2} />
          <Text style={s.logoutText}>Cerrar sesion</Text>
        </TouchableOpacity>

        <Text style={s.versionText}>FreshList v1.0.0</Text>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editField !== null} animationType="slide" transparent>
        <View style={ms.overlay}>
          <View style={ms.sheet}>
            <View style={ms.sheetHeader}>
              <TouchableOpacity onPress={() => setEditField(null)}>
                <X size={22} color={colors.textSec} />
              </TouchableOpacity>
              <Text style={ms.sheetTitle}>{editField ? modalTitles[editField] : ''}</Text>
              <TouchableOpacity onPress={saveField}>
                <Check size={22} color={colors.green600} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            {renderModalContent()}
          </View>
        </View>
      </Modal>
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
  nameCard: { alignItems: 'center', paddingVertical: spacing.lg, gap: 6 },
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
  premiumCard: {
    backgroundColor: '#FFFBEB', borderRadius: radius.lg, padding: 16,
    borderWidth: 1, borderColor: '#FDE68A', flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, marginTop: 12, backgroundColor: colors.red50,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.red100,
  },
  logoutText: { fontSize: 15, fontFamily: fonts.bold, color: colors.red500 },
  versionText: { fontSize: 11, fontFamily: fonts.regular, color: colors.textDim, textAlign: 'center', marginTop: 16, marginBottom: 20 },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%', paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  sheetTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  body: { padding: spacing.lg, gap: 10 },
  label: { fontSize: 13, fontFamily: fonts.medium, color: colors.textMuted, marginBottom: 4 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 16, fontFamily: fonts.regular, color: colors.text,
  },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 12 },
  counterBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  counterValue: { fontSize: 32, fontFamily: fonts.black, color: colors.text, minWidth: 40, textAlign: 'center' },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: radius.md, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  optionActive: { borderColor: colors.green400, backgroundColor: colors.green50 },
  optionText: { fontSize: 15, fontFamily: fonts.medium, color: colors.text },
  optionTextActive: { fontFamily: fonts.bold, color: colors.green700 },
  optionDesc: { fontSize: 11, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 2 },
});
