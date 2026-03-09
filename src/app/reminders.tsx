import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Plus, Check, Trash2, ShoppingCart, Lightbulb } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import {
  getReminders,
  addReminder,
  toggleReminder,
  deleteReminder,
  clearCompletedReminders,
  moveReminderToList,
} from '../services/supabase/shoppingReminders';
import { addShoppingItem } from '../services/supabase/shopping';
import type { ShoppingReminder } from '../types';

export default function RemindersScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState<ShoppingReminder[]>([]);
  const [newText, setNewText] = useState('');

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    const data = await getReminders();
    setReminders(data);
  }

  async function handleAdd() {
    const name = newText.trim();
    if (!name) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const added = await addReminder(name);
    setReminders((prev) => [added, ...prev]);
    setNewText('');
  }

  async function handleToggle(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleReminder(id);
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)),
    );
  }

  async function handleDelete(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteReminder(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleMoveToList(id: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const name = await moveReminderToList(id);
      await addShoppingItem({
        name,
        category: 'Otro',
        quantity: 1,
        unit: 'unidad',
        source: 'manual',
      });
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, completed: true } : r)),
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleClearCompleted() {
    await clearCompletedReminders();
    setReminders((prev) => prev.filter((r) => !r.completed));
  }

  const active = reminders.filter((r) => !r.completed);
  const completed = reminders.filter((r) => r.completed);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Recordar comprar</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        {/* Info hint */}
        <View style={s.hint}>
          <Lightbulb size={14} color={colors.amber400} strokeWidth={2} />
          <Text style={s.hintText}>Anota cosas que necesitas recordar para tu proxima compra</Text>
        </View>

        {/* Add input */}
        <View style={s.addRow}>
          <TextInput
            style={s.addInput}
            placeholder="Ej: Papel de horno, pilas AAA..."
            placeholderTextColor={colors.textMuted}
            value={newText}
            onChangeText={setNewText}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
            <Plus size={18} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Active reminders */}
        {active.length === 0 && completed.length === 0 && (
          <View style={s.emptyBox}>
            <ShoppingCart size={32} color={colors.textDim} strokeWidth={1.5} />
            <Text style={s.emptyTitle}>Nada pendiente</Text>
            <Text style={s.emptySub}>Cuando se te ocurra algo, anotalo aqui y lo tendras listo la proxima vez</Text>
          </View>
        )}

        {active.map((rem) => (
          <View key={rem.id} style={s.item}>
            <TouchableOpacity style={s.checkArea} onPress={() => handleToggle(rem.id)}>
              <View style={s.checkbox} />
              <Text style={s.itemName}>{rem.name}</Text>
            </TouchableOpacity>
            <View style={s.itemActions}>
              <TouchableOpacity onPress={() => handleMoveToList(rem.id)} style={s.actionBtn}>
                <ShoppingCart size={14} color={colors.green600} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(rem.id)} style={s.actionBtn}>
                <Trash2 size={14} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <View style={s.completedHeader}>
              <Text style={s.completedTitle}>COMPLETADOS ({completed.length})</Text>
              <TouchableOpacity onPress={handleClearCompleted}>
                <Text style={s.clearText}>Limpiar</Text>
              </TouchableOpacity>
            </View>
            {completed.map((rem) => (
              <View key={rem.id} style={[s.item, s.itemCompleted]}>
                <TouchableOpacity style={s.checkArea} onPress={() => handleToggle(rem.id)}>
                  <View style={s.checkboxDone}>
                    <Check size={12} color="white" strokeWidth={3} />
                  </View>
                  <Text style={s.itemNameDone}>{rem.name}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(rem.id)} style={s.actionBtn}>
                  <Trash2 size={14} color={colors.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: fonts.black, color: colors.text },
  hint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFBEB', borderRadius: radius.md, padding: 12,
    borderWidth: 1, borderColor: '#FDE68A', marginBottom: 14,
  },
  hintText: { flex: 1, fontSize: 12, fontFamily: fonts.medium, color: colors.textSec },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  addInput: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: fonts.regular, fontSize: 13, color: colors.text,
    borderWidth: 1, borderColor: colors.border,
  },
  addBtn: {
    width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.green600,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyBox: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.textSec, marginTop: 12 },
  emptySub: { fontSize: 12, fontFamily: fonts.regular, color: colors.textMuted, textAlign: 'center', marginTop: 4, paddingHorizontal: 30 },
  item: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border, marginBottom: 4,
  },
  itemCompleted: { opacity: 0.5 },
  checkArea: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border,
  },
  checkboxDone: {
    width: 22, height: 22, borderRadius: 6, backgroundColor: colors.green500,
    justifyContent: 'center', alignItems: 'center',
  },
  itemName: { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  itemNameDone: { fontSize: 14, fontFamily: fonts.medium, color: colors.textMuted, textDecorationLine: 'line-through' },
  itemActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  completedHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, marginBottom: 8,
  },
  completedTitle: { fontSize: 11, fontFamily: fonts.bold, color: colors.textMuted, letterSpacing: 0.5 },
  clearText: { fontSize: 12, fontFamily: fonts.bold, color: colors.red400 },
});
