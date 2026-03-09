import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, Share, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { ShoppingCart, UtensilsCrossed, Package, Plus, Check, Trash2, X, Share2, PackageCheck, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { SwipeToDelete } from '../../components/ui/SwipeToDelete';
import { STORES } from '../../constants/stores';
import { useShopping } from '../../hooks/useShopping';

export default function ShoppingScreen() {
  const router = useRouter();
  const {
    items,
    allItems,
    loading,
    error,
    filterStore,
    setFilterStore,
    load,
    addItem,
    togglePurchased,
    removeItem,
    clearPurchased,
    isInPantry,
  } = useShopping();

  const [newItemText, setNewItemText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  useEffect(() => { load(); }, [load]);

  if (error) {
    Alert.alert('Error', error);
  }

  async function handleAdd() {
    const name = newItemText.trim();
    if (!name) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addItem(name);
    setNewItemText('');
  }

  async function handleToggle(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePurchased(id);
  }

  async function handleRemove(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeItem(id);
  }

  const planItems = items.filter((i) => i.source === 'ai_suggestion');
  const stapleItems = items.filter((i) => i.source === 'auto');
  const manualItems = items.filter((i) => i.source === 'manual' || i.source === 'voice');
  const purchasedCount = allItems.filter((i) => i.purchased).length;
  const totalCount = allItems.length;

  async function handleShare() {
    const unpurchased = allItems.filter((i) => !i.purchased);
    if (unpurchased.length === 0) {
      Alert.alert('Lista vacia', 'No hay productos por comprar');
      return;
    }
    const plan = unpurchased.filter((i) => i.source === 'ai_suggestion');
    const staples = unpurchased.filter((i) => i.source === 'auto');
    const manual = unpurchased.filter((i) => i.source === 'manual' || i.source === 'voice');

    let text = 'Lista de compra FreshList\n';
    if (plan.length > 0) {
      text += '\nDel plan:\n' + plan.map((i) => `- ${i.quantity}x ${i.name}`).join('\n');
    }
    if (staples.length > 0) {
      text += '\n\nFondo cocina:\n' + staples.map((i) => `- ${i.name}`).join('\n');
    }
    if (manual.length > 0) {
      text += '\n\nOtros:\n' + manual.map((i) => `- ${i.quantity}x ${i.name}`).join('\n');
    }
    try {
      await Share.share({ message: text });
    } catch (_) {}
  }

  const storeFilters = [{ id: null, name: 'Todos', color: colors.green600 }, ...STORES.map((s) => ({ ...s, id: s.id as string | null }))];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ padding: spacing.lg }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green600} />}>
        <View style={s.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={20} color={colors.green600} strokeWidth={2.2} />
              <Text style={s.title}>Lista de compra</Text>
            </View>
            <Text style={s.subtitle}>{totalCount} productos · {purchasedCount} comprados</Text>
          </View>
          <TouchableOpacity onPress={handleShare} style={{ padding: 4 }}>
            <Share2 size={20} color={colors.green600} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        {totalCount > 0 && (
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${Math.round((purchasedCount / totalCount) * 100)}%` }]} />
          </View>
        )}

        {/* Add item input */}
        <View style={s.addRow}>
          <TextInput
            style={s.addInput}
            placeholder="Añadir producto..."
            placeholderTextColor={colors.textMuted}
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity style={s.addBtn} onPress={handleAdd} accessibilityLabel="Anadir producto" accessibilityRole="button">
            <Plus size={18} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Store filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {storeFilters.map((st) => {
              const active = filterStore === st.id;
              return (
                <TouchableOpacity
                  key={st.name}
                  style={[s.chip, active && { backgroundColor: st.color, borderColor: st.color }]}
                  onPress={() => setFilterStore(active ? null : st.id)}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>{st.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {loading ? (
          <View style={{ gap: 4, marginTop: 10 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : items.length === 0 ? (
          <View style={s.emptyBox}>
            <View style={s.emptyIconBox}>
              <ShoppingCart size={36} color={colors.green400} strokeWidth={1.5} />
            </View>
            <Text style={s.emptyText}>Lista vacía</Text>
            <Text style={s.emptyHint}>Añade productos manualmente o genera un plan de comidas para crear tu lista</Text>
            <TouchableOpacity style={s.emptyCta} onPress={() => router.push('/plan')}>
              <Sparkles size={14} color="white" strokeWidth={2.5} />
              <Text style={s.emptyCtaText}>Generar plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Plan items */}
            {planItems.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <UtensilsCrossed size={13} color={colors.green600} strokeWidth={2.5} />
                  <Text style={[s.sectionTitle, { color: colors.green600 }]}>DEL PLAN DE COMIDAS</Text>
                </View>
                {planItems.map((item) => (
                  <SwipeToDelete key={item.id} onDelete={() => handleRemove(item.id)}>
                    <ShoppingRow
                      item={item}
                      iconBg={colors.green50}
                      iconColor={colors.green600}
                      inPantry={isInPantry(item.name)}
                      onToggle={() => handleToggle(item.id)}
                      onRemove={() => handleRemove(item.id)}
                    />
                  </SwipeToDelete>
                ))}
              </View>
            )}

            {/* Staples */}
            {stapleItems.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Package size={13} color={colors.violet400} strokeWidth={2.5} />
                  <Text style={[s.sectionTitle, { color: colors.violet400 }]}>FONDO DE COCINA</Text>
                </View>
                {stapleItems.map((item) => (
                  <SwipeToDelete key={item.id} onDelete={() => handleRemove(item.id)}>
                    <ShoppingRow
                      item={item}
                      iconBg={colors.violet50}
                      iconColor={colors.violet400}
                      inPantry={isInPantry(item.name)}
                      onToggle={() => handleToggle(item.id)}
                      onRemove={() => handleRemove(item.id)}
                    />
                  </SwipeToDelete>
                ))}
              </View>
            )}

            {/* Manual */}
            {manualItems.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Plus size={13} color={colors.textSec} strokeWidth={2.5} />
                  <Text style={[s.sectionTitle, { color: colors.textSec }]}>AÑADIDOS MANUALMENTE</Text>
                </View>
                {manualItems.map((item) => (
                  <SwipeToDelete key={item.id} onDelete={() => handleRemove(item.id)}>
                    <ShoppingRow
                      item={item}
                      iconBg={colors.surface}
                      iconColor={colors.textSec}
                      inPantry={isInPantry(item.name)}
                      onToggle={() => handleToggle(item.id)}
                      onRemove={() => handleRemove(item.id)}
                    />
                  </SwipeToDelete>
                ))}
              </View>
            )}
          </>
        )}

        {/* Clear purchased */}
        {purchasedCount > 0 && !filterStore && (
          <TouchableOpacity style={s.clearBtn} onPress={clearPurchased}>
            <Trash2 size={14} color={colors.red400} strokeWidth={2.2} />
            <Text style={s.clearText}>Limpiar comprados ({purchasedCount})</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ShoppingRow({
  item,
  iconBg,
  iconColor,
  inPantry,
  onToggle,
  onRemove,
}: {
  item: { id: string; name: string; quantity: number; unit: string; purchased: boolean; store?: string };
  iconBg: string;
  iconColor: string;
  inPantry?: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={[s.item, item.purchased && s.itemPurchased]}>
      <TouchableOpacity style={s.itemLeft} onPress={onToggle}>
        <View style={[s.checkbox, item.purchased && s.checkboxDone]}>
          {item.purchased && <Check size={12} color="white" strokeWidth={3} />}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[s.itemName, item.purchased && s.itemNameDone]}>{item.name}</Text>
            {inPantry && !item.purchased && (
              <View style={s.pantryBadge}>
                <PackageCheck size={10} color={colors.green600} strokeWidth={2.5} />
                <Text style={s.pantryBadgeText}>Ya lo tienes</Text>
              </View>
            )}
          </View>
          <Text style={s.itemMeta}>
            {item.quantity} {item.unit}
            {item.store ? ` · ${item.store}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onRemove} style={{ padding: 4 }}>
        <X size={14} color={colors.textMuted} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title: { fontSize: 20, fontFamily: fonts.black, color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 4 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  addInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.green600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipText: { fontSize: 11, fontFamily: fonts.medium, color: colors.textSec },
  chipTextActive: { color: 'white', fontFamily: fonts.bold },
  section: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.5 },
  item: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemPurchased: { opacity: 0.5 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: { backgroundColor: colors.green500, borderColor: colors.green500 },
  itemName: { fontSize: 13, fontFamily: fonts.medium, color: colors.text },
  itemNameDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  itemMeta: { fontSize: 10, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 1 },
  clearBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.red50,
    borderRadius: radius.md,
    paddingVertical: 12,
    marginTop: 8,
  },
  clearText: { fontSize: 12, fontFamily: fonts.bold, color: colors.red400 },
  progressBar: { height: 6, backgroundColor: colors.surface, borderRadius: 3, marginBottom: 14, overflow: 'hidden' as const },
  progressFill: { height: 6, backgroundColor: colors.green500, borderRadius: 3 },
  pantryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.green50,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pantryBadgeText: { fontSize: 9, fontFamily: fonts.bold, color: colors.green600 },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyIconBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.green50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyText: { fontSize: 18, fontFamily: fonts.bold, color: colors.textSec },
  emptyHint: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.green600, borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 12, marginTop: 16 },
  emptyCtaText: { fontSize: 13, fontFamily: fonts.bold, color: 'white' },
});
