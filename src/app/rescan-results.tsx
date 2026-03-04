import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, CircleMinus, CirclePlus, Eye } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { getRescanResult, clearRescanResult } from '../services/scan/scanStore';
import { updatePantryItem, insertPantryItems } from '../services/supabase/pantry';
import { incrementUsed } from '../services/supabase/stats';
import { ocrProductToPantryItem } from '../services/ai/ocr';

export default function RescanResultsScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const result = getRescanResult();

  if (!result) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.bold, color: colors.textSec }}>Sin resultados</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: fonts.bold, color: colors.green600 }}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { consumed, newItems, pantryItems } = result;

  async function handleConfirm() {
    setSaving(true);
    try {
      // Mark consumed items as used
      for (const name of consumed) {
        const match = pantryItems.find(
          (p) => p.name.toLowerCase() === name.toLowerCase() &&
            (p.status === 'fresh' || p.status === 'expiring'),
        );
        if (match) {
          await updatePantryItem(match.id, { status: 'used' });
          await incrementUsed().catch(() => {});
        }
      }
      // Add new items to pantry
      if (newItems.length > 0) {
        const items = newItems.map(ocrProductToPantryItem);
        await insertPantryItems(items);
      }
      clearRescanResult();
      router.back();
    } catch (e) {
      console.error('Error applying rescan:', e);
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = consumed.length > 0 || newItems.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => { clearRescanResult(); router.back(); }} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Resultado del re-escaneo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: 16 }}>
        {/* Consumed */}
        {consumed.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <CircleMinus size={16} color={colors.orange500} strokeWidth={2} />
              <Text style={s.sectionTitle}>Consumidos ({consumed.length})</Text>
            </View>
            <Text style={s.sectionHint}>Ya no aparecen en la foto — se marcaran como usados</Text>
            {consumed.map((name, i) => (
              <View key={i} style={s.itemRow}>
                <View style={[s.dot, { backgroundColor: colors.orange400 }]} />
                <Text style={s.itemName}>{name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* New items */}
        {newItems.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <CirclePlus size={16} color={colors.green600} strokeWidth={2} />
              <Text style={s.sectionTitle}>Nuevos ({newItems.length})</Text>
            </View>
            <Text style={s.sectionHint}>Detectados en la foto pero no en tu inventario</Text>
            {newItems.map((item, i) => (
              <View key={i} style={s.itemRow}>
                <View style={[s.dot, { backgroundColor: colors.green500 }]} />
                <Text style={s.itemName}>{item.name}</Text>
                <Text style={s.itemMeta}>{item.quantity} {item.unit}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Still present */}
        {result.stillPresent.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Eye size={16} color={colors.textMuted} strokeWidth={2} />
              <Text style={[s.sectionTitle, { color: colors.textMuted }]}>
                Sin cambios ({result.stillPresent.length})
              </Text>
            </View>
            {result.stillPresent.map((name, i) => (
              <View key={i} style={s.itemRow}>
                <View style={[s.dot, { backgroundColor: colors.border }]} />
                <Text style={[s.itemName, { color: colors.textMuted }]}>{name}</Text>
              </View>
            ))}
          </View>
        )}

        {!hasChanges && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ fontFamily: fonts.bold, color: colors.textSec, fontSize: 16 }}>
              Todo igual que antes
            </Text>
            <Text style={{ fontFamily: fonts.regular, color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
              No se detectaron cambios en tu despensa
            </Text>
          </View>
        )}
      </ScrollView>

      {hasChanges && (
        <View style={s.footer}>
          <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Check size={18} color="white" strokeWidth={2.5} />
                <Text style={s.confirmText}>Aplicar cambios</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  section: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  sectionHint: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.regular, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  itemName: { fontSize: 14, fontFamily: fonts.medium, color: colors.text, flex: 1 },
  itemMeta: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.regular },
  footer: {
    padding: spacing.lg, paddingBottom: 36, backgroundColor: colors.bg,
  },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.green600, paddingVertical: 16, borderRadius: radius.md,
  },
  confirmText: { fontSize: 15, fontFamily: fonts.bold, color: 'white' },
});
