import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, AlertTriangle, ChefHat, BarChart3 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { requestPermissions } from '../services/notifications';

const NOTIF_KEYS = {
  expiry: 'notif_expiry_enabled',
  cookReminder: 'notif_cook_enabled',
  weeklySummary: 'notif_weekly_enabled',
};

async function getNotifSettings(): Promise<Record<string, boolean>> {
  const keys = Object.values(NOTIF_KEYS);
  const pairs = await AsyncStorage.multiGet(keys);
  const result: Record<string, boolean> = {};
  for (const [key, val] of pairs) {
    result[key] = val === null ? true : val === 'true'; // default on
  }
  return result;
}

async function setNotifSetting(key: string, value: boolean): Promise<void> {
  await AsyncStorage.setItem(key, String(value));
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [permGranted, setPermGranted] = useState(true);

  useEffect(() => {
    getNotifSettings().then(setSettings);
    requestPermissions().then(setPermGranted);
  }, []);

  function toggle(key: string) {
    const newVal = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newVal }));
    setNotifSetting(key, newVal);
  }

  async function handleRequestPermission() {
    const granted = await requestPermissions();
    setPermGranted(granted);
    if (!granted) {
      Alert.alert('Permisos denegados', 'Activa las notificaciones en Ajustes del sistema');
    }
  }

  const ITEMS = [
    {
      key: NOTIF_KEYS.expiry,
      Icon: AlertTriangle,
      title: 'Productos por caducar',
      desc: 'Notificacion diaria a las 9:00 si algo caduca hoy o manana',
      iconBg: colors.orange50,
      iconColor: colors.orange500,
    },
    {
      key: NOTIF_KEYS.cookReminder,
      Icon: ChefHat,
      title: 'Recordatorio de cocina',
      desc: 'A las 21:00 si no has cocinado el plato del dia',
      iconBg: colors.green50,
      iconColor: colors.green600,
    },
    {
      key: NOTIF_KEYS.weeklySummary,
      Icon: BarChart3,
      title: 'Resumen semanal',
      desc: 'Cada domingo a las 20:00 con tu progreso',
      iconBg: colors.violet50,
      iconColor: colors.violet400,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notificaciones</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={{ padding: spacing.lg, gap: 10 }}>
        {!permGranted && (
          <TouchableOpacity style={s.permBanner} onPress={handleRequestPermission}>
            <Bell size={18} color={colors.orange500} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={s.permTitle}>Notificaciones desactivadas</Text>
              <Text style={s.permSub}>Toca para activarlas</Text>
            </View>
          </TouchableOpacity>
        )}

        {ITEMS.map((item) => (
          <View key={item.key} style={s.card}>
            <View style={[s.cardIcon, { backgroundColor: item.iconBg }]}>
              <item.Icon size={18} color={item.iconColor} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{item.title}</Text>
              <Text style={s.cardDesc}>{item.desc}</Text>
            </View>
            <Switch
              value={settings[item.key] ?? true}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: colors.surfaceHover, true: colors.green400 }}
              thumbColor="white"
            />
          </View>
        ))}
      </View>
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
  permBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.orange50, borderRadius: radius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.orange100,
  },
  permTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.orange500 },
  permSub: { fontSize: 11, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 16,
    borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  cardIcon: { width: 40, height: 40, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  cardDesc: { fontSize: 11, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 2 },
});
