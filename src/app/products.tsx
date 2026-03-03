import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Store,
  Trash2,
  Check,
  ChevronLeft,
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
} from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { getScanResult, clearScanResult } from '../services/scan/scanStore';
import { insertPantryItems } from '../services/supabase/pantry';
import type { PantryItem } from '../types';

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

function freshnessChip(status: PantryItem['status']) {
  switch (status) {
    case 'fresh':
      return { label: 'Fresco', bg: colors.green50, color: colors.green700 };
    case 'expiring':
      return { label: 'Por caducar', bg: colors.orange50, color: colors.orange500 };
    case 'expired':
      return { label: 'Caducado', bg: colors.red50, color: colors.red500 };
    default:
      return { label: status, bg: colors.surface, color: colors.textSec };
  }
}

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<PantryItem[]>([]);
  const [storeName, setStoreName] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const result = getScanResult();
    if (result) {
      setProducts(result.products);
      setStoreName(result.store);
    }
  }, []);

  const expiringCount = products.filter((p) => p.status === 'expiring' || p.status === 'expired').length;

  function updateProduct(id: string, updates: Partial<PantryItem>) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }

  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSave() {
    if (products.length === 0) return;
    setSaving(true);
    try {
      await insertPantryItems(products);
      clearScanResult();
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudieron guardar los productos');
    } finally {
      setSaving(false);
    }
  }

  function renderItem({ item }: { item: PantryItem }) {
    const Icon = CATEGORY_ICONS[item.category] ?? Package;
    const chip = freshnessChip(item.status);

    return (
      <View style={s.row}>
        <View style={s.iconBox}>
          <Icon size={18} color={colors.green600} strokeWidth={2} />
        </View>
        <View style={s.rowContent}>
          <TextInput
            style={s.nameInput}
            value={item.name}
            onChangeText={(t) => updateProduct(item.id, { name: t })}
          />
          <View style={s.rowMeta}>
            <Text style={s.qty}>
              {item.quantity} {item.unit}
            </Text>
            <View style={[s.chip, { backgroundColor: chip.bg }]}>
              <Text style={[s.chipText, { color: chip.color }]}>{chip.label}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={s.deleteBtn} onPress={() => removeProduct(item.id)}>
          <Trash2 size={16} color={colors.red400} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.title}>Productos detectados</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Store badge */}
      {storeName && (
        <View style={s.storeBadge}>
          <Store size={14} color={colors.green600} strokeWidth={2} />
          <Text style={s.storeText}>{storeName}</Text>
        </View>
      )}

      {/* Summary */}
      <View style={s.summary}>
        <Text style={s.summaryText}>
          {products.length} detectados
          {expiringCount > 0 && (
            <Text style={{ color: colors.orange500 }}> · {expiringCount} caducan pronto</Text>
          )}
        </Text>
      </View>

      {/* Product list */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        ListEmptyComponent={
          <Text style={s.empty}>No se detectaron productos</Text>
        }
      />

      {/* Save button */}
      {products.length > 0 && (
        <View style={s.footer}>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Check size={18} color="white" strokeWidth={2.5} />
                <Text style={s.saveText}>Guardar en despensa</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  title: { fontSize: 18, fontFamily: fonts.black, color: colors.text },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: colors.green50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  storeText: { fontSize: 12, fontFamily: fonts.bold, color: colors.green700 },
  summary: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  summaryText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSec },
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
  nameInput: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
    padding: 0,
    marginBottom: 2,
  },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qty: { fontSize: 11, fontFamily: fonts.regular, color: colors.textMuted },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  chipText: { fontSize: 10, fontFamily: fonts.bold },
  deleteBtn: { padding: 6 },
  separator: { height: 8 },
  empty: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 60,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: 36,
    backgroundColor: colors.bg,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.green600,
    paddingVertical: 16,
    borderRadius: radius.md,
  },
  saveText: { fontSize: 15, fontFamily: fonts.bold, color: 'white' },
});
