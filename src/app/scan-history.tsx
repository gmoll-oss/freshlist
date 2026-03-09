import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Receipt, Camera, Trash2, Clock } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { getScanHistory, clearScanHistory, ScanHistoryEntry } from '../services/scan/scanHistory';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return `Hace ${diff} dias`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function ScanHistoryScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<ScanHistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const data = await getScanHistory();
    setEntries(data);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  async function handleClear() {
    await clearScanHistory();
    setEntries([]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Historial de escaneos</Text>
        {entries.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={{ padding: 4 }}>
            <Trash2 size={18} color={colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      {entries.length === 0 ? (
        <View style={s.emptyBox}>
          <View style={s.emptyIcon}>
            <Clock size={36} color={colors.green400} strokeWidth={1.5} />
          </View>
          <Text style={s.emptyTitle}>Sin escaneos aun</Text>
          <Text style={s.emptySub}>Tus escaneos apareceran aqui</Text>
        </View>
      ) : (
        <ScrollView
          style={{ padding: spacing.lg }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.green600} />}
        >
          {entries.map((entry) => {
            const ModeIcon = entry.mode === 'ticket' ? Receipt : Camera;
            return (
              <View key={entry.id} style={s.card}>
                <View style={[s.iconBox, { backgroundColor: entry.mode === 'ticket' ? colors.green50 : colors.violet50 }]}>
                  <ModeIcon size={18} color={entry.mode === 'ticket' ? colors.green600 : colors.violet400} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.cardTop}>
                    <Text style={s.cardTitle}>
                      {entry.mode === 'ticket' ? 'Ticket' : 'Foto nevera'}
                      {entry.store ? ` · ${entry.store}` : ''}
                    </Text>
                    <Text style={s.cardDate}>{formatDate(entry.date)}</Text>
                  </View>
                  <Text style={s.cardCount}>{entry.itemCount} productos</Text>
                  <Text style={s.cardItems} numberOfLines={2}>
                    {entry.itemNames.join(', ')}
                  </Text>
                </View>
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.green50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.textSec },
  emptySub: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, textAlign: 'center', marginTop: 6 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.border, flexDirection: 'row', gap: 12, marginBottom: 8,
  },
  iconBox: { width: 40, height: 40, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  cardDate: { fontSize: 11, fontFamily: fonts.regular, color: colors.textMuted },
  cardCount: { fontSize: 12, fontFamily: fonts.medium, color: colors.green600, marginTop: 2 },
  cardItems: { fontSize: 11, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 2 },
});
