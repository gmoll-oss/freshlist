import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Heart, Timer, Users, CookingPot, Trash2 } from 'lucide-react-native';
import Haptics from '../utils/haptics';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { fetchFavorites, deleteFavorite, RecipeFavorite } from '../services/supabase/favorites';
import { setCurrentMeal } from '../services/mealPlan/mealPlanStore';

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<RecipeFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadFavorites() {
    try {
      const data = await fetchFavorites();
      setFavorites(data);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { loadFavorites(); }, []);

  async function handleRemove(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteFavorite(id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }

  function handleCook(fav: RecipeFavorite) {
    setCurrentMeal({
      id: fav.id,
      week_start: '',
      day: '',
      meal_type: fav.meal_type as any,
      meal_name: fav.meal_name,
      ingredients: fav.ingredients,
      steps: fav.steps,
      prep_time_minutes: fav.prep_time_minutes,
      servings: fav.servings,
      batch_note: null,
      reuses_from: null,
      cooked: false,
    });
    router.push(`/cook/${fav.id}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mis favoritas</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.green600} />
        </View>
      ) : favorites.length === 0 ? (
        <View style={s.emptyBox}>
          <Heart size={40} color={colors.textDim} strokeWidth={1.5} />
          <Text style={s.emptyTitle}>Sin favoritas aun</Text>
          <Text style={s.emptySub}>Guarda recetas que te gusten pulsando el corazon al cocinar</Text>
        </View>
      ) : (
        <ScrollView style={{ padding: spacing.lg }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFavorites(); }} tintColor={colors.green600} />}>
          {favorites.map((fav) => (
            <View key={fav.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.mealName}>{fav.meal_name}</Text>
                  <View style={s.metaRow}>
                    <Timer size={11} color={colors.textMuted} strokeWidth={2} />
                    <Text style={s.metaText}>{fav.prep_time_minutes} min</Text>
                    <Users size={11} color={colors.textMuted} strokeWidth={2} />
                    <Text style={s.metaText}>{fav.servings} pers</Text>
                    <CookingPot size={11} color={colors.green600} strokeWidth={2} />
                    <Text style={[s.metaText, { color: colors.green600 }]}>
                      {fav.times_cooked}x cocinada
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleRemove(fav.id)} style={{ padding: 4 }}>
                  <Trash2 size={16} color={colors.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.cookBtn} onPress={() => handleCook(fav)}>
                <CookingPot size={14} color="white" strokeWidth={2.5} />
                <Text style={s.cookBtnText}>Cocinar</Text>
              </TouchableOpacity>
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
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.textSec, marginTop: 16 },
  emptySub: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, textAlign: 'center', marginTop: 6 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  mealName: { fontSize: 16, fontFamily: fonts.bold, color: colors.text, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, fontFamily: fonts.regular, color: colors.textMuted, marginRight: 8 },
  cookBtn: {
    backgroundColor: colors.green600, borderRadius: radius.md, paddingVertical: 10,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  cookBtnText: { fontSize: 13, fontFamily: fonts.bold, color: 'white' },
});
