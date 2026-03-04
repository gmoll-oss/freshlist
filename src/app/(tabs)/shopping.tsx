import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { ShoppingCart, UtensilsCrossed, Package, Plus, Check, Trash2, X } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { STORES } from '../../constants/stores';
import { useShopping } from '../../hooks/useShopping';

export default function ShoppingScreen() {
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
  } = useShopping();

  const [newItemText, setNewItemText] = useState('');

  useEffect(() => { load(); }, [load]);

  if (error) {
    Alert.alert('Error', error);
  }

  async function handleAdd() {
    const name = newItemText.trim();
    if (!name) return;
    await addItem(name);
    setNewItemText('');
  }

  const planItems = items.filter((i) => i.source === 'ai_suggestion');
  const stapleItems = items.filter((i) => i.source === 'auto');
  const manualItems = items.filter((i) => i.source === 'manual' || i.source === 'voice');
  const purchasedCount = allItems.filter((i) => i.purchased).length;
  const totalCount = allItems.length;

  const storeFilters = [{ id: null, name: 'Todos', color: colors.green600 }, ...STORES.map((s) => ({ ...s, id: s.id as string | null }))];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={20} color={colors.green600} strokeWidth={2.2} />
              <Text style={s.title}>Lista de compra</Text>
            </View>
            <Text style={s.subtitle}>{totalCount} productos · {purchasedCount} comprados</Text>
          </View>
        </View>

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
          <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
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
          <ActivityIndicator size="large" color={colors.green600} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>Lista vacía</Text>
            <Text style={s.emptyHint}>Añade productos manualmente o genera un plan de comidas</Text>
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
                  <ShoppingRow
                    key={item.id}
                    item={item}
                    iconBg={colors.green50}
                    iconColor={colors.green600}
                    onToggle={() => togglePurchased(item.id)}
                    onRemove={() => removeItem(item.id)}
                  />
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
                  <ShoppingRow
                    key={item.id}
                    item={item}
                    iconBg={colors.violet50}
                    iconColor={colors.violet400}
                    onToggle={() => togglePurchased(item.id)}
                    onRemove={() => removeItem(item.id)}
                  />
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
                  <ShoppingRow
                    key={item.id}
                    item={item}
                    iconBg={colors.surface}
                    iconColor={colors.textSec}
                    onToggle={() => togglePurchased(item.id)}
                    onRemove={() => removeItem(item.id)}
                  />
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
  onToggle,
  onRemove,
}: {
  item: { id: string; name: string; quantity: number; unit: string; purchased: boolean; store?: string };
  iconBg: string;
  iconColor: string;
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
          <Text style={[s.itemName, item.purchased && s.itemNameDone]}>{item.name}</Text>
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
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontFamily: fonts.bold, color: colors.textSec },
  emptyHint: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
});
