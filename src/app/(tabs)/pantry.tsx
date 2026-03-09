import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback, useMemo } from 'react';
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
  Plus,
  ScanLine,
  Search,
  ArrowUpDown,
  X,
  Edit3,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { fetchPantryItems, updatePantryItem, insertPantryItems, deletePantryItem } from '../../services/supabase/pantry';
import { incrementUsed, incrementThrown } from '../../services/supabase/stats';
import type { PantryItem } from '../../types';

const CATEGORY_ICONS: Record<string, any> = {
  Proteina: Beef, Verdura: Carrot, Fruta: Apple, Lacteo: Milk,
  Cereal: Wheat, Panaderia: Croissant, Congelado: Snowflake,
  Bebida: Coffee, Snack: Cookie, Limpieza: SprayCan, Otro: Package,
};

const ALL_CATEGORIES = Object.keys(CATEGORY_ICONS);

type SortMode = 'expiry' | 'name' | 'category';

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
  const router = useRouter();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newProduct, setNewProduct] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('expiry');
  const [editItem, setEditItem] = useState<PantryItem | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editExpiry, setEditExpiry] = useState('');

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await updatePantryItem(id, { status: 'used' });
      await incrementUsed();
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'used' as const } : i));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleThrown(id: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await updatePantryItem(id, { status: 'thrown' });
      await incrementThrown();
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'thrown' as const } : i));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleDelete(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await deletePantryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleAddManual() {
    const name = newProduct.trim();
    if (!name) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const today = new Date().toISOString().split('T')[0];
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    const newItem: PantryItem = {
      id: `manual-${Date.now()}`,
      name,
      category: 'Otro',
      quantity: 1,
      unit: 'ud',
      purchase_date: today,
      estimated_expiry: expiry.toISOString().split('T')[0],
      status: 'fresh',
      confidence: 'media',
    };
    try {
      await insertPantryItems([newItem]);
      setNewProduct('');
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo añadir');
    }
  }

  function openEditModal(item: PantryItem) {
    setEditItem(item);
    setEditQty(String(item.quantity));
    setEditExpiry(item.estimated_expiry);
  }

  async function handleSaveEdit() {
    if (!editItem) return;
    const qty = parseInt(editQty, 10);
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Error', 'Cantidad invalida');
      return;
    }
    try {
      await updatePantryItem(editItem.id, {
        quantity: qty,
        estimated_expiry: editExpiry,
      });
      setItems((prev) =>
        prev.map((i) => i.id === editItem.id
          ? { ...i, quantity: qty, estimated_expiry: editExpiry }
          : i
        ),
      );
      setEditItem(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  const activeItems = items.filter((i) => i.status !== 'used' && i.status !== 'thrown');

  const filteredAndSorted = useMemo(() => {
    let result = activeItems;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }

    // Category filter
    if (filterCategory) {
      result = result.filter((i) => i.category === filterCategory);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortMode === 'expiry') return daysUntil(a.estimated_expiry) - daysUntil(b.estimated_expiry);
      if (sortMode === 'name') return a.name.localeCompare(b.name);
      return a.category.localeCompare(b.category);
    });

    return result;
  }, [activeItems, searchQuery, filterCategory, sortMode]);

  const freshCount = activeItems.filter((i) => daysUntil(i.estimated_expiry) > 3).length;
  const expiringCount = activeItems.filter((i) => {
    const d = daysUntil(i.estimated_expiry);
    return d >= 0 && d <= 3;
  }).length;
  const expiredCount = activeItems.filter((i) => daysUntil(i.estimated_expiry) < 0).length;

  const SORT_LABELS: Record<SortMode, string> = { expiry: 'Caducidad', name: 'Nombre', category: 'Categoria' };
  const SORT_CYCLE: SortMode[] = ['expiry', 'name', 'category'];

  function cycleSortMode() {
    const idx = SORT_CYCLE.indexOf(sortMode);
    setSortMode(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function renderItem({ item }: { item: PantryItem }) {
    const Icon = CATEGORY_ICONS[item.category] ?? Package;
    const info = freshnessInfo(item);

    return (
      <TouchableOpacity style={s.row} onLongPress={() => openEditModal(item)} activeOpacity={0.7}>
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
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Mi Despensa</Text>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={s.headerBtn}>
            <Search size={18} color={showSearch ? colors.green600 : colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={cycleSortMode} style={s.headerBtn}>
            <ArrowUpDown size={16} color={colors.textMuted} strokeWidth={2} />
            <Text style={s.sortLabel}>{SORT_LABELS[sortMode]}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      {showSearch && (
        <View style={s.searchRow}>
          <Search size={14} color={colors.textMuted} strokeWidth={2} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar producto..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Category filter chips */}
      {activeItems.length > 0 && (
        <FlatList
          horizontal
          data={[null, ...ALL_CATEGORIES]}
          keyExtractor={(item) => item ?? 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catRow}
          renderItem={({ item: cat }) => {
            const active = filterCategory === cat;
            const CatIcon = cat ? (CATEGORY_ICONS[cat] ?? Package) : null;
            return (
              <TouchableOpacity
                style={[s.catChip, active && s.catChipActive]}
                onPress={() => setFilterCategory(active ? null : cat)}
              >
                {CatIcon && <CatIcon size={12} color={active ? 'white' : colors.textSec} strokeWidth={2} />}
                <Text style={[s.catChipText, active && s.catChipTextActive]}>
                  {cat ?? 'Todos'}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Manual add + rescan */}
      <View style={s.actionRow}>
        <View style={s.addInputRow}>
          <TextInput
            style={s.addInput}
            placeholder="Añadir producto..."
            placeholderTextColor={colors.textMuted}
            value={newProduct}
            onChangeText={setNewProduct}
            onSubmitEditing={handleAddManual}
            returnKeyType="done"
          />
          <TouchableOpacity style={s.addBtn} onPress={handleAddManual}>
            <Plus size={16} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.rescanBtn} onPress={() => router.push('/(tabs)/scan' as any)}>
          <ScanLine size={16} color={colors.green600} strokeWidth={2} />
          <Text style={s.rescanText}>Escanear</Text>
        </TouchableOpacity>
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
          data={filteredAndSorted}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green600} />}
          ListEmptyComponent={
            <View style={s.center}>
              <View style={s.emptyIconBox}>
                <Package size={36} color={colors.green400} strokeWidth={1.5} />
              </View>
              <Text style={s.empty}>
                {searchQuery || filterCategory ? 'Sin resultados' : 'Tu despensa está vacía'}
              </Text>
              <Text style={s.emptyHint}>
                {searchQuery || filterCategory
                  ? 'Prueba con otro filtro o búsqueda'
                  : 'Escanea un ticket o foto de nevera para añadir productos'}
              </Text>
              {!searchQuery && !filterCategory && (
                <TouchableOpacity style={s.emptyCta} onPress={() => router.push('/(tabs)/scan' as any)}>
                  <ScanLine size={14} color="white" strokeWidth={2.5} />
                  <Text style={s.emptyCtaText}>Escanear ahora</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Edit modal */}
      <Modal visible={!!editItem} transparent animationType="fade" onRequestClose={() => setEditItem(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setEditItem(null)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>{editItem?.name}</Text>
            <Text style={s.modalSub}>{editItem?.category}</Text>

            <Text style={s.modalLabel}>Cantidad</Text>
            <TextInput
              style={s.modalInput}
              value={editQty}
              onChangeText={setEditQty}
              keyboardType="number-pad"
              placeholder="1"
            />

            <Text style={s.modalLabel}>Fecha de caducidad (YYYY-MM-DD)</Text>
            <TextInput
              style={s.modalInput}
              value={editExpiry}
              onChangeText={setEditExpiry}
              placeholder="2024-12-31"
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalDeleteBtn} onPress={() => { if (editItem) { handleDelete(editItem.id); setEditItem(null); } }}>
                <Trash2 size={16} color={colors.red500} strokeWidth={2} />
                <Text style={s.modalDeleteText}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSaveBtn} onPress={handleSaveEdit}>
                <Check size={16} color="white" strokeWidth={2.5} />
                <Text style={s.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  title: { fontSize: 18, fontFamily: fonts.black, color: colors.text },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  sortLabel: { fontSize: 10, fontFamily: fonts.medium, color: colors.textMuted },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: fonts.regular, color: colors.text, padding: 0 },
  catRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 6 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.green600, borderColor: colors.green600 },
  catChipText: { fontSize: 10, fontFamily: fonts.medium, color: colors.textSec },
  catChipTextActive: { color: 'white', fontFamily: fonts.bold },
  actionRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: spacing.lg, marginBottom: spacing.md,
  },
  addInputRow: { flex: 1, flexDirection: 'row', gap: 6 },
  addInput: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
    fontFamily: fonts.regular, fontSize: 13, color: colors.text,
    borderWidth: 1, borderColor: colors.border,
  },
  addBtn: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.green600, justifyContent: 'center', alignItems: 'center',
  },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.green50, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.green200,
  },
  rescanText: { fontSize: 12, fontFamily: fonts.bold, color: colors.green600 },
  summary: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  summaryCard: { flex: 1, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  summaryNum: { fontSize: 20, fontFamily: fonts.black },
  summaryLabel: { fontSize: 10, fontFamily: fonts.medium, color: colors.textSec, marginTop: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.md, padding: 12, gap: 10,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.green50, justifyContent: 'center', alignItems: 'center',
  },
  rowContent: { flex: 1 },
  name: { fontSize: 14, fontFamily: fonts.bold, color: colors.text, marginBottom: 2 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qty: { fontSize: 11, fontFamily: fonts.regular, color: colors.textMuted },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  chipText: { fontSize: 10, fontFamily: fonts.bold },
  actions: { flexDirection: 'row', gap: 6 },
  usedBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.green50, justifyContent: 'center', alignItems: 'center',
  },
  thrownBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.red50, justifyContent: 'center', alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyIconBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.green50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  empty: { fontSize: 18, fontFamily: fonts.bold, color: colors.textSec },
  emptyHint: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.green600, borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 12, marginTop: 16 },
  emptyCtaText: { fontSize: 13, fontFamily: fonts.bold, color: 'white' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, marginBottom: 4 },
  modalSub: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.regular, marginBottom: 16 },
  modalLabel: { fontSize: 12, fontFamily: fonts.bold, color: colors.textSec, marginBottom: 6, marginTop: 8 },
  modalInput: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: fonts.medium, color: colors.text,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalDeleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.red50, borderRadius: radius.md, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.red100,
  },
  modalDeleteText: { fontSize: 14, fontFamily: fonts.bold, color: colors.red500 },
  modalSaveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.green600, borderRadius: radius.md, paddingVertical: 14,
  },
  modalSaveText: { fontSize: 14, fontFamily: fonts.bold, color: 'white' },
});
