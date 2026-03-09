import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, Sparkles, Crown, Zap, Users, Brain } from 'lucide-react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { getOfferings, purchasePackage, restorePurchases } from '../services/purchases/revenuecat';

const PREMIUM_FEATURES = [
  { Icon: Brain, label: 'IA ilimitada', desc: 'Planes de comida y chat sin limites' },
  { Icon: Users, label: 'Familia', desc: 'Comparte despensa y plan con tu hogar' },
  { Icon: Zap, label: 'Autopilot', desc: 'Planificacion automatica semanal' },
  { Icon: Sparkles, label: 'Recetas premium', desc: 'Recetas exclusivas de chefs' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    getOfferings()
      .then((pkgs) => {
        setPackages(pkgs);
        if (pkgs.length > 0) setSelected(pkgs[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handlePurchase() {
    if (!selected) return;
    setPurchasing(true);
    try {
      const success = await purchasePackage(selected);
      if (success) {
        Alert.alert('Bienvenido a Premium!', 'Disfruta de todas las funciones', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo completar la compra');
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setPurchasing(true);
    try {
      const success = await restorePurchases();
      if (success) {
        Alert.alert('Restaurado!', 'Tu suscripcion premium esta activa', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Sin compras', 'No se encontraron compras anteriores');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudieron restaurar las compras');
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        <View style={s.crownBox}>
          <Crown size={40} color={colors.amber400} strokeWidth={1.8} />
        </View>
        <Text style={s.title}>FreshList Premium</Text>
        <Text style={s.subtitle}>Desbloquea todo el potencial</Text>

        <View style={s.features}>
          {PREMIUM_FEATURES.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <View style={s.featureIcon}>
                <f.Icon size={16} color={colors.green600} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.featureLabel}>{f.label}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
              <Check size={16} color={colors.green500} strokeWidth={2.5} />
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.green600} style={{ marginTop: 20 }} />
        ) : (
          <>
            {packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={[s.pkgCard, selected?.identifier === pkg.identifier && s.pkgCardActive]}
                onPress={() => setSelected(pkg)}
              >
                <Text style={[s.pkgTitle, selected?.identifier === pkg.identifier && s.pkgTitleActive]}>
                  {pkg.product.title}
                </Text>
                <Text style={[s.pkgPrice, selected?.identifier === pkg.identifier && s.pkgPriceActive]}>
                  {pkg.product.priceString}
                </Text>
              </TouchableOpacity>
            ))}

            {packages.length === 0 && (
              <View style={s.noPkgs}>
                <Text style={s.noPkgsText}>Proximamente disponible</Text>
                <Text style={s.noPkgsSub}>Las suscripciones se activaran pronto</Text>
              </View>
            )}
          </>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[s.buyBtn, (!selected || purchasing) && { opacity: 0.5 }]}
          onPress={handlePurchase}
          disabled={!selected || purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Crown size={18} color="white" strokeWidth={2.5} />
              <Text style={s.buyText}>Suscribirse</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={s.restoreBtn} onPress={handleRestore} disabled={purchasing}>
          <Text style={s.restoreText}>Restaurar compras</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  crownBox: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: '#FFFBEB',
    justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16,
  },
  title: { fontSize: 26, fontFamily: fonts.black, color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: fonts.regular, color: colors.textMuted, textAlign: 'center', marginBottom: 24 },
  features: { gap: 10, marginBottom: 24 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: radius.md, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.green50,
    justifyContent: 'center', alignItems: 'center',
  },
  featureLabel: { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  featureDesc: { fontSize: 11, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 1 },
  pkgCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 16,
    borderWidth: 2, borderColor: colors.border, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pkgCardActive: { borderColor: colors.green500, backgroundColor: colors.green50 },
  pkgTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  pkgTitleActive: { color: colors.green700 },
  pkgPrice: { fontSize: 16, fontFamily: fonts.black, color: colors.textSec },
  pkgPriceActive: { color: colors.green700 },
  noPkgs: { alignItems: 'center', paddingVertical: 20 },
  noPkgsText: { fontSize: 16, fontFamily: fonts.bold, color: colors.textSec },
  noPkgsSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 4 },
  buyBtn: {
    backgroundColor: colors.green600, borderRadius: radius.md, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  buyText: { fontSize: 16, fontFamily: fonts.bold, color: 'white' },
  restoreBtn: { alignItems: 'center', paddingVertical: 14 },
  restoreText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textMuted },
});
