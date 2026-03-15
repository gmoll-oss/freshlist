import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Alert } from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import Haptics from '../utils/haptics';
import { ChevronLeft, Check, AlertTriangle } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { fetchPantryItems } from '../services/supabase/pantry';
import { consumePantryItem } from '../services/supabase/pantry';
import type { PantryItem } from '../types';

function daysUntilExpiry(item: PantryItem): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(item.estimated_expiry);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function groupByCategory(items: PantryItem[]): Record<string, PantryItem[]> {
  const groups: Record<string, PantryItem[]> = {};
  for (const item of items) {
    const cat = item.category || 'Otros';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}

export default function DailyCheckinScreen() {
  const router = useRouter();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const all = await fetchPantryItems();
      const active = all.filter((i) => i.status === 'fresh' || i.status === 'expiring');
      setItems(active);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirm() {
    if (selected.size === 0) return;
    setConfirming(true);
    try {
      for (const id of selected) {
        await consumePantryItem(id);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSummary(`Has marcado ${selected.size} productos como usados`);
      setSelected(new Set());
      // Reload items to reflect changes
      const all = await fetchPantryItems();
      const active = all.filter((i) => i.status === 'fresh' || i.status === 'expiring');
      setItems(active);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setConfirming(false);
    }
  }

  const grouped = groupByCategory(items);
  const categories = Object.keys(grouped).sort();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.title}>Que has consumido hoy?</Text>
        <View style={{ width: 36 }} />
      </View>

      {summary && (
        <View style={s.summaryBanner}>
          <Check size={16} color={colors.green600} strokeWidth={2.5} />
          <Text style={s.summaryText}>{summary}</Text>
        </View>
      )}

      <ScrollView style={{ flex: 1, padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        {loading && <Text style={s.loadingText}>Cargando despensa...</Text>}

        {!loading && items.length === 0 && (
          <Text style={s.emptyText}>No tienes productos activos en la despensa</Text>
        )}

        {categories.map((category) => (
          <View key={category} style={s.categoryBlock}>
            <Text style={s.categoryTitle}>{category.toUpperCase()}</Text>
            {grouped[category].map((item) => {
              const days = daysUntilExpiry(item);
              const isExpiringSoon = days <= 3;
              const isSelected = selected.has(item.id);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[s.itemRow, isSelected && s.itemRowSelected]}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[s.checkbox, isSelected && s.checkboxChecked]}>
                    {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{item.name}</Text>
                    <Text style={s.itemMeta}>
                      {item.quantity} {item.unit}
                      {days <= 0 ? ' — Caduca hoy' : ` — ${days}d restantes`}
                    </Text>
                  </View>
                  {isExpiringSoon && (
                    <View style={s.warningBadge}>
                      <AlertTriangle size={11} color={colors.orange500} strokeWidth={2.5} />
                      <Text style={s.warningText}>{days <= 0 ? 'Hoy' : `${days}d`}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom confirm button */}
      {items.length > 0 && (
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.confirmBtn, selected.size === 0 && s.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={selected.size === 0 || confirming}
          >
            <Check size={18} color="white" strokeWidth={2.5} />
            <Text style={s.confirmText}>
              {confirming ? 'Guardando...' : `Confirmar${selected.size > 0 ? ` (${selected.size})` : ''}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.green50,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.green200,
  },
  summaryText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.green700,
  },

  loadingText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },

  categoryBlock: {
    marginBottom: spacing.lg,
  },
  categoryTitle: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  itemRowSelected: {
    borderColor: colors.green400,
    backgroundColor: colors.green50,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.green600,
    borderColor: colors.green600,
  },

  itemName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  itemMeta: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },

  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.orange50,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.orange100,
  },
  warningText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.orange500,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.green600,
    borderRadius: radius.lg,
    paddingVertical: 16,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: 'white',
  },
});
