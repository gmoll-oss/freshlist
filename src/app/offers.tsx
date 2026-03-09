import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Tag, Percent, ShoppingCart, AlertTriangle } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useLocation } from '../hooks/useLocation';
import { useOffers } from '../hooks/useOffers';
import { useShopping } from '../hooks/useShopping';
import { getStoreInfo } from '../services/offers/offerService';
import type { OfferMatch } from '../types';

export default function OffersScreen() {
  const router = useRouter();
  const { location, loading: locLoading, error: locError, requestLocation } = useLocation();
  const { matches, loading: offersLoading, loadOffers } = useOffers();
  const { items, load: loadShopping } = useShopping();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    requestLocation();
    loadShopping();
  }, []);

  useEffect(() => {
    if (location && items.length >= 0) {
      loadOffers(location, items);
    }
  }, [location, items.length]);

  async function onRefresh() {
    setRefreshing(true);
    await requestLocation();
    await loadShopping();
    if (location) await loadOffers(location, items);
    setRefreshing(false);
  }

  const loading = locLoading || offersLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ofertas</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ padding: spacing.lg }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green600} />}
      >
        {/* Location status */}
        {location ? (
          <View style={s.locBadge}>
            <MapPin size={13} color={colors.green600} strokeWidth={2} />
            <Text style={s.locText}>
              {location.city ?? 'Tu zona'}{location.postal_code ? ` (${location.postal_code})` : ''}
            </Text>
          </View>
        ) : locError ? (
          <TouchableOpacity style={s.locError} onPress={requestLocation}>
            <AlertTriangle size={14} color={colors.orange500} strokeWidth={2} />
            <Text style={s.locErrorText}>Activa la ubicacion para ver ofertas cercanas</Text>
          </TouchableOpacity>
        ) : null}

        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={colors.green600} />
            <Text style={s.loadingText}>Buscando ofertas cerca de ti...</Text>
          </View>
        )}

        {!loading && matches.length === 0 && (
          <View style={s.emptyBox}>
            <View style={s.emptyIcon}>
              <Tag size={32} color={colors.green400} strokeWidth={1.5} />
            </View>
            <Text style={s.emptyTitle}>Sin ofertas disponibles</Text>
            <Text style={s.emptySub}>
              Cuando conectemos con los supermercados de tu zona, veras aqui las ofertas que coincidan con tu lista de compra y tus habitos
            </Text>
            <View style={s.comingSoon}>
              <Text style={s.comingSoonText}>Proximamente: Mercadona, Lidl, Carrefour, DIA, Aldi, Consum</Text>
            </View>
          </View>
        )}

        {matches.length > 0 && (
          <>
            <Text style={s.sectionTitle}>OFERTAS PARA TI ({matches.length})</Text>
            {matches.map((match, i) => (
              <OfferCard key={i} match={match} />
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function OfferCard({ match }: { match: OfferMatch }) {
  const store = getStoreInfo(match.offer.store_id);
  const relevanceLabel = {
    exact: 'En tu lista',
    similar: 'Producto habitual',
    category: 'Misma categoria',
  }[match.relevance];

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={[s.storeDot, { backgroundColor: store.color }]} />
        <Text style={s.storeName}>{store.name}</Text>
        <View style={s.relevanceBadge}>
          <Text style={s.relevanceText}>{relevanceLabel}</Text>
        </View>
      </View>
      <Text style={s.productName}>{match.offer.product_name}</Text>
      <View style={s.priceRow}>
        <Text style={s.oldPrice}>{match.offer.original_price.toFixed(2)}€</Text>
        <Text style={s.newPrice}>{match.offer.offer_price.toFixed(2)}€</Text>
        <View style={s.discountBadge}>
          <Percent size={10} color="white" strokeWidth={3} />
          <Text style={s.discountText}>-{match.offer.discount_pct}%</Text>
        </View>
      </View>
      <Text style={s.validUntil}>Hasta {match.offer.valid_until}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: fonts.black, color: colors.text },
  locBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    backgroundColor: colors.green50, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.full, marginBottom: 14,
  },
  locText: { fontSize: 12, fontFamily: fonts.bold, color: colors.green700 },
  locError: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.orange50, borderRadius: radius.md, padding: 12,
    borderWidth: 1, borderColor: colors.orange100, marginBottom: 14,
  },
  locErrorText: { flex: 1, fontSize: 12, fontFamily: fonts.medium, color: colors.orange500 },
  loadingText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textMuted, marginTop: 12 },
  emptyBox: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: colors.green50,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.textSec },
  emptySub: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, textAlign: 'center', marginTop: 6, paddingHorizontal: 20, lineHeight: 20 },
  comingSoon: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, marginTop: 20,
  },
  comingSoonText: { fontSize: 11, fontFamily: fonts.medium, color: colors.textMuted, textAlign: 'center' },
  sectionTitle: { fontSize: 11, fontFamily: fonts.bold, color: colors.textMuted, letterSpacing: 0.5, marginBottom: 10 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  storeDot: { width: 8, height: 8, borderRadius: 4 },
  storeName: { fontSize: 11, fontFamily: fonts.bold, color: colors.textSec },
  relevanceBadge: { marginLeft: 'auto', backgroundColor: colors.green50, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  relevanceText: { fontSize: 9, fontFamily: fonts.bold, color: colors.green600 },
  productName: { fontSize: 15, fontFamily: fonts.bold, color: colors.text, marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  oldPrice: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, textDecorationLine: 'line-through' },
  newPrice: { fontSize: 17, fontFamily: fonts.black, color: colors.green600 },
  discountBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.red400, borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { fontSize: 10, fontFamily: fonts.bold, color: 'white' },
  validUntil: { fontSize: 10, fontFamily: fonts.regular, color: colors.textMuted },
});
