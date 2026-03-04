import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import {
  Apple,
  Beef,
  Milk,
  Wheat,
  Carrot,
  Snowflake,
  Coffee,
  Cookie,
  SprayCan,
  Package,
  Croissant,
  Check,
  Trash2,
} from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { fetchPantryItems, updatePantryItem } from '../../services/supabase/pantry';
import { incrementUsed, incrementThrown } from '../../services/supabase/stats';
import type { PantryItem } from '../../types';

const CATEGORY_ICONS: Record<string, any> = {
  Proteina: Beef,
  Verdura: Carrot,
  Fruta: Apple,
  Lacteo: Milk,
  Cereal: Wheat,
  Panaderia: Croissant,
  Congelado: Snowflake,
  Bebida: Coffee,
  Snack: Cookie,
  Limpieza: SprayCan,
  Otro: Package,
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function freshnessInfo(item: PantryItem) {
  const days = daysUntil(item.estimated_expiry);
  if (days < 0) return { label: `Caducado hace ${Math.abs(days)}d`, bg: colors.red50, color: colors.red500 };
  if (days === 0) return { label: 'Caduca hoy', bg: colors.red50, color: colors.red500 };
  if (days <= 3) return { label: `${days}d restantes`, bg: colors.orange50, color: colors.orange500 };
  return { label: `${days}d restantes`, bg: colors.green50, color: colors.green700 };
}

export default function PantryTabScreen() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchPantryItems();
      setItems(data);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo cargar la despensa');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  async function handleUsed(id: string) {
    try {
      await updatePantryItem(id, { status: 'used' });
      await incrementUsed();
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'used' as const } : i));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleThrown(id: string) {
    try {
      await updatePantryItem(id, { status: 'thrown' });
      await incrementThrown();
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'thrown' as const } : i));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  const activeItems = items.filter((i) => i.status !== 'used' && i.status !== 'thrown');

  const freshCount = activeItems.filter((i) => daysUntil(i.estimated_expiry) > 3).length;
  const expiringCount = activeItems.filter((i) => {
    const d = daysUntil(i.estimated_expiry);
    return d >= 0 && d <= 3;
  }).length;
  const expiredCount = activeItems.filter((i) => daysUntil(i.estimated_expiry) < 0).length;

  function renderItem({ item }: { item: PantryItem }) {
    const Icon = CATEGORY_ICONS[item.category] ?? Package;
    const info = freshnessInfo(item);

    return (
      <View style={s.row}>
        <View style={s.iconBox}>
          <Icon size={18} color={colors.green600} strokeWidth={2} />
        </View>
        <View style={s.rowContent}>
          <Text style={s.name}>{item.name}</Text>
          <View style={s.rowMeta}>
            <Text style={s.qty}>{item.quantity} {item.unit}</Text>
            <View style={[s.chip, { backgroundColor: info.bg }]}>
              <Text style={[s.chipText, { color: info.color }]}>{info.label}</Text>
            </View>
          </View>
        </View>
        <View style={s.actions}>
          <TouchableOpacity style={s.usedBtn} onPress={() => handleUsed(item.id)}>
            <Check size={14} color={colors.green600} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={s.thrownBtn} onPress={() => handleThrown(item.id)}>
            <Trash2 size={14} color={colors.red400} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Mi Despensa</Text>
      </View>

      {!loading && activeItems.length > 0 && (
        <View style={s.summary}>
          <View style={[s.summaryCard, { backgroundColor: colors.green50 }]}>
            <Text style={[s.summaryNum, { color: colors.green700 }]}>{freshCount}</Text>
            <Text style={s.summaryLabel}>Frescos</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: colors.orange50 }]}>
            <Text style={[s.summaryNum, { color: colors.orange500 }]}>{expiringCount}</Text>
            <Text style={s.summaryLabel}>Por caducar</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: colors.red50 }]}>
            <Text style={[s.summaryNum, { color: colors.red500 }]}>{expiredCount}</Text>
            <Text style={s.summaryLabel}>Caducados</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.green600} />
        </View>
      ) : (
        <FlatList
          data={activeItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green600} />}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={s.empty}>Tu despensa está vacía</Text>
              <Text style={s.emptyHint}>Escanea un ticket o foto de nevera para añadir productos</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontFamily: fonts.black, color: colors.text },
  summary: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: 12,
    alignItems: 'center',
  },
  summaryNum: { fontSize: 20, fontFamily: fonts.black },
  summaryLabel: { fontSize: 10, fontFamily: fonts.medium, color: colors.textSec, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.green50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: { flex: 1 },
  name: { fontSize: 14, fontFamily: fonts.bold, color: colors.text, marginBottom: 2 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qty: { fontSize: 11, fontFamily: fonts.regular, color: colors.textMuted },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  chipText: { fontSize: 10, fontFamily: fonts.bold },
  actions: { flexDirection: 'row', gap: 6 },
  usedBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.green50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thrownBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.red50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  empty: { fontSize: 16, fontFamily: fonts.bold, color: colors.textSec },
  emptyHint: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
});
