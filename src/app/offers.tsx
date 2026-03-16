import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Tag, Percent, Search, Star, X, Clock } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useLocation } from '../hooks/useLocation';
import { useOffers } from '../hooks/useOffers';
import { useShopping } from '../hooks/useShopping';
import { getStoreInfo } from '../services/offers/offerService';
import { STORES } from '../constants/stores';
import type { OfferMatch, SupermarketOffer } from '../types';

export default function OffersScreen() {
  const router = useRouter();
  const { location, loading: locLoading, error: locError, requestLocation } = useLocation();
  const {
    offers,
    matches,
    loading: offersLoading,
    favoriteStores,
    offerCounts,
    loadOffers,
    search,
    loadFavorites,
    toggleFavorite,
    loadCounts,
  } = useOffers();
  const { items, load: loadShopping } = useShopping();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [showAllOffers, setShowAllOffers] = useState(false);

  useEffect(() => {
    requestLocation();
    loadShopping();
    loadFavorites();
    loadCounts();
  }, []);

  useEffect(() => {
    if (location) {
      const storeFilter = selectedStore ? [selectedStore] : undefined;
      loadOffers(location, items, storeFilter);
    }
  }, [location, items.length, selectedStore]);

  async function onRefresh() {
    setRefreshing(true);
    await requestLocation();
    await loadShopping();
    await loadCounts();
    if (location) {
      const storeFilter = selectedStore ? [selectedStore] : undefined;
      await loadOffers(location, items, storeFilter);
    }
    setRefreshing(false);
  }

  async function onSearch() {
    if (searchQuery.trim()) {
      await search(searchQuery.trim());
      setShowAllOffers(true);
    }
  }

  function clearSearch() {
    setSearchQuery('');
    setShowAllOffers(false);
    if (location) {
      const storeFilter = selectedStore ? [selectedStore] : undefined;
      loadOffers(location, items, storeFilter);
    }
  }

  const loading = locLoading || offersLoading;

  // All offers (unmatched) for browsing
  const allOffers = useMemo(() => {
    const matchedIds = new Set(matches.map((m) => m.offer.id));
    return offers.filter((o) => !matchedIds.has(o.id));
  }, [offers, matches]);

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
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green600} />}
      >
        {/* Location badge */}
        {location ? (
          <View style={s.locBadge}>
            <MapPin size={13} color={colors.green600} strokeWidth={2} />
            <Text style={s.locText}>
              {location.city ?? 'Tu zona'}{location.postal_code ? ` (${location.postal_code})` : ''}
            </Text>
          </View>
        ) : locError ? (
          <TouchableOpacity style={s.locError} onPress={requestLocation}>
            <MapPin size={14} color={colors.orange500} strokeWidth={2} />
            <Text style={s.locErrorText}>Activa la ubicacion para ver ofertas cercanas</Text>
          </TouchableOpacity>
        ) : null}

        {/* Search bar */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Search size={16} color={colors.textMuted} strokeWidth={2} />
            <TextInput
              style={s.searchInput}
              placeholder="Buscar producto..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={onSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <X size={16} color={colors.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Store chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.storeScroll}
          contentContainerStyle={s.storeScrollContent}
        >
          <TouchableOpacity
            style={[s.storeChip, !selectedStore && s.storeChipActive]}
            onPress={() => setSelectedStore(null)}
          >
            <Text style={[s.storeChipText, !selectedStore && s.storeChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          {STORES.map((store) => {
            const isSelected = selectedStore === store.id;
            const isFav = favoriteStores.includes(store.id);
            const count = offerCounts[store.id] || 0;
            return (
              <TouchableOpacity
                key={store.id}
                style={[s.storeChip, isSelected && { backgroundColor: store.color }]}
                onPress={() => setSelectedStore(isSelected ? null : store.id)}
                onLongPress={() => toggleFavorite(store.id)}
              >
                {isFav && <Star size={10} color={isSelected ? 'white' : colors.orange500} strokeWidth={2.5} fill={isSelected ? 'white' : colors.orange500} />}
                <Text style={[s.storeChipText, isSelected && { color: 'white' }]}>
                  {store.name}
                </Text>
                {count > 0 && (
                  <View style={[s.countBadge, isSelected && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                    <Text style={[s.countText, isSelected && { color: 'white' }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.lg }}>
          {/* Loading */}
          {loading && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={colors.green600} />
              <Text style={s.loadingText}>Buscando ofertas...</Text>
            </View>
          )}

          {/* Empty state */}
          {!loading && offers.length === 0 && matches.length === 0 && (
            <View style={s.emptyBox}>
              <View style={s.emptyIcon}>
                <Tag size={32} color={colors.green400} strokeWidth={1.5} />
              </View>
              <Text style={s.emptyTitle}>Sin ofertas disponibles</Text>
              <Text style={s.emptySub}>
                Las ofertas se sincronizan automaticamente desde Mercadona, Lidl, Carrefour, DIA, Aldi, Alcampo, Consum, Eroski y BonPreu
              </Text>
              <TouchableOpacity style={s.refreshBtn} onPress={onRefresh}>
                <Text style={s.refreshBtnText}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Matched offers (from shopping list) */}
          {matches.length > 0 && (
            <>
              <Text style={s.sectionTitle}>OFERTAS PARA TI ({matches.length})</Text>
              {matches.map((match, i) => (
                <OfferCard key={`match-${i}`} match={match} />
              ))}
            </>
          )}

          {/* All other offers */}
          {(showAllOffers || allOffers.length > 0) && allOffers.length > 0 && (
            <>
              <Text style={[s.sectionTitle, matches.length > 0 && { marginTop: 20 }]}>
                {searchQuery ? `RESULTADOS (${allOffers.length})` : `TODAS LAS OFERTAS (${allOffers.length})`}
              </Text>
              {allOffers.slice(0, showAllOffers ? undefined : 10).map((offer, i) => (
                <OfferCardSimple key={`offer-${i}`} offer={offer} />
              ))}
              {!showAllOffers && allOffers.length > 10 && (
                <TouchableOpacity style={s.showMoreBtn} onPress={() => setShowAllOffers(true)}>
                  <Text style={s.showMoreText}>Ver {allOffers.length - 10} ofertas mas</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </View>
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
        {match.offer.original_price > 0 && (
          <Text style={s.oldPrice}>{match.offer.original_price.toFixed(2)}€</Text>
        )}
        <Text style={s.newPrice}>{match.offer.offer_price.toFixed(2)}€</Text>
        {match.offer.discount_pct > 0 && (
          <View style={s.discountBadge}>
            <Percent size={10} color="white" strokeWidth={3} />
            <Text style={s.discountText}>-{match.offer.discount_pct}%</Text>
          </View>
        )}
      </View>
      {match.offer.valid_until ? (
        <View style={s.validRow}>
          <Clock size={10} color={colors.textMuted} strokeWidth={2} />
          <Text style={s.validUntil}>Hasta {match.offer.valid_until}</Text>
        </View>
      ) : null}
    </View>
  );
}

function OfferCardSimple({ offer }: { offer: SupermarketOffer }) {
  const store = getStoreInfo(offer.store_id);

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={[s.storeDot, { backgroundColor: store.color }]} />
        <Text style={s.storeName}>{store.name}</Text>
        {offer.category ? (
          <View style={s.categoryBadge}>
            <Text style={s.categoryText}>{offer.category}</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.productName}>{offer.product_name}</Text>
      <View style={s.priceRow}>
        {offer.original_price > 0 && (
          <Text style={s.oldPrice}>{offer.original_price.toFixed(2)}€</Text>
        )}
        <Text style={s.newPrice}>{offer.offer_price.toFixed(2)}€</Text>
        {offer.discount_pct > 0 && (
          <View style={s.discountBadge}>
            <Percent size={10} color="white" strokeWidth={3} />
            <Text style={s.discountText}>-{offer.discount_pct}%</Text>
          </View>
        )}
      </View>
      {offer.valid_until ? (
        <View style={s.validRow}>
          <Clock size={10} color={colors.textMuted} strokeWidth={2} />
          <Text style={s.validUntil}>Hasta {offer.valid_until}</Text>
        </View>
      ) : null}
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
    borderRadius: radius.full, marginBottom: 10,
  },
  locText: { fontSize: 12, fontFamily: fonts.bold, color: colors.green700 },
  locError: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.orange50, borderRadius: radius.md, padding: 12,
    borderWidth: 1, borderColor: colors.orange100, marginHorizontal: spacing.lg, marginBottom: 10,
  },
  locErrorText: { flex: 1, fontSize: 12, fontFamily: fonts.medium, color: colors.orange500 },

  // Search
  searchRow: { paddingHorizontal: spacing.lg, marginBottom: 10 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.text, padding: 0 },

  // Store chips
  storeScroll: { marginBottom: 14 },
  storeScrollContent: { paddingHorizontal: spacing.lg, gap: 6 },
  storeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: colors.border,
  },
  storeChipActive: { backgroundColor: colors.green600, borderColor: colors.green600 },
  storeChipText: { fontSize: 12, fontFamily: fonts.bold, color: colors.textSec },
  storeChipTextActive: { color: 'white' },
  countBadge: {
    backgroundColor: colors.green50, borderRadius: 10,
    paddingHorizontal: 5, paddingVertical: 1, marginLeft: 2,
  },
  countText: { fontSize: 9, fontFamily: fonts.bold, color: colors.green700 },

  // Loading & empty
  loadingText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textMuted, marginTop: 12 },
  emptyBox: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: colors.green50,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.textSec },
  emptySub: {
    fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted,
    textAlign: 'center', marginTop: 6, paddingHorizontal: 20, lineHeight: 20,
  },
  refreshBtn: {
    backgroundColor: colors.green600, borderRadius: radius.md,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 16,
  },
  refreshBtnText: { fontSize: 13, fontFamily: fonts.bold, color: 'white' },

  // Section
  sectionTitle: { fontSize: 11, fontFamily: fonts.bold, color: colors.textMuted, letterSpacing: 0.5, marginBottom: 10 },

  // Cards
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  storeDot: { width: 8, height: 8, borderRadius: 4 },
  storeName: { fontSize: 11, fontFamily: fonts.bold, color: colors.textSec },
  relevanceBadge: { marginLeft: 'auto', backgroundColor: colors.green50, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  relevanceText: { fontSize: 9, fontFamily: fonts.bold, color: colors.green600 },
  categoryBadge: { marginLeft: 'auto', backgroundColor: colors.surface, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  categoryText: { fontSize: 9, fontFamily: fonts.bold, color: colors.textMuted },
  productName: { fontSize: 15, fontFamily: fonts.bold, color: colors.text, marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  oldPrice: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, textDecorationLine: 'line-through' },
  newPrice: { fontSize: 17, fontFamily: fonts.black, color: colors.green600 },
  discountBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.red400, borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { fontSize: 10, fontFamily: fonts.bold, color: 'white' },
  validRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  validUntil: { fontSize: 10, fontFamily: fonts.regular, color: colors.textMuted },
  showMoreBtn: {
    alignItems: 'center', paddingVertical: 12, marginTop: 4,
    backgroundColor: colors.surface, borderRadius: radius.md,
  },
  showMoreText: { fontSize: 13, fontFamily: fonts.bold, color: colors.green600 },
});
