import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart, UtensilsCrossed, Package, Check, Leaf, Egg } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

const PLAN_ITEMS = [
  { name: 'Pechuga pollo x2', price: '4.99€', deal: true, save: '-23%', store: 'Lidl' },
  { name: 'Espinacas frescas', price: '1.20€', deal: false, store: 'Mercadona' },
  { name: 'Tomates rama 1kg', price: '1.49€', deal: true, save: '-15%', store: 'Carrefour' },
  { name: 'Yogur natural x4', price: '1.60€', deal: false, store: 'Mercadona' },
];

const STAPLE_ITEMS = [
  { name: 'Aceite oliva virgen extra', price: '6.99€', reason: 'Última compra: hace 5 semanas' },
  { name: 'Huevos x12', price: '1.89€', deal: true, save: '-10%', reason: 'Cada 10 días' },
  { name: 'Ajo (malla)', price: '0.99€', reason: 'Semanal' },
];

export default function ShoppingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={20} color={colors.green600} strokeWidth={2.2} />
              <Text style={s.title}>Lista de compra</Text>
            </View>
            <Text style={s.subtitle}>12 productos · ~32€ estimado</Text>
          </View>
          <View style={s.saveBadge}>
            <Text style={s.saveNum}>-4.80€</Text>
            <Text style={s.saveLabel}>con ofertas</Text>
          </View>
        </View>

        {/* Store filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {['Mercadona', 'Lidl', 'Carrefour', 'Todos'].map((s2, i) => (
              <TouchableOpacity key={i} style={[s.chip, i === 0 && s.chipActive]}>
                <Text style={[s.chipText, i === 0 && s.chipTextActive]}>{s2}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Plan items */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <UtensilsCrossed size={13} color={colors.green600} strokeWidth={2.5} />
            <Text style={[s.sectionTitle, { color: colors.green600 }]}>DEL PLAN DE COMIDAS</Text>
          </View>
          {PLAN_ITEMS.map((item, i) => (
            <View key={i} style={s.item}>
              <View style={s.itemLeft}>
                <View style={[s.itemIcon, { backgroundColor: colors.green50 }]}>
                  <Leaf size={16} color={colors.green600} strokeWidth={1.8} />
                </View>
                <View>
                  <Text style={s.itemName}>{item.name}</Text>
                  <Text style={s.itemStore}>{item.store}</Text>
                </View>
              </View>
              <View style={s.itemRight}>
                {item.deal && <View style={s.dealBadge}><Text style={s.dealText}>{item.save}</Text></View>}
                <Text style={[s.itemPrice, item.deal && { color: colors.green700 }]}>{item.price}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Staples */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Package size={13} color={colors.violet400} strokeWidth={2.5} />
            <Text style={[s.sectionTitle, { color: colors.violet400 }]}>FONDO DE COCINA</Text>
          </View>
          {STAPLE_ITEMS.map((item, i) => (
            <View key={i} style={s.item}>
              <View style={s.itemLeft}>
                <View style={[s.itemIcon, { backgroundColor: colors.violet50 }]}>
                  <Egg size={16} color={colors.violet400} strokeWidth={1.8} />
                </View>
                <View>
                  <Text style={s.itemName}>{item.name}</Text>
                  <Text style={s.itemReason}>{item.reason}</Text>
                </View>
              </View>
              <View style={s.itemRight}>
                {item.deal && <View style={s.dealBadge}><Text style={s.dealText}>{item.save}</Text></View>}
                <Text style={s.itemPrice}>{item.price}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={s.totalCard}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total estimado</Text>
            <Text style={s.totalValue}>~32€</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={[s.totalLabel, { color: colors.green600, fontFamily: fonts.medium }]}>Ahorro con ofertas</Text>
            <Text style={[s.totalValue, { color: colors.green600 }]}>-4.80€</Text>
          </View>
        </View>

        <TouchableOpacity style={s.orderBtn}>
          <Check size={16} color="white" strokeWidth={2.5} />
          <Text style={s.orderBtnText}>Organizar por pasillos</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title: { fontSize: 20, fontFamily: fonts.black, color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 4 },
  saveBadge: { backgroundColor: colors.green50, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.green100, alignItems: 'center' },
  saveNum: { fontSize: 13, fontFamily: fonts.bold, color: colors.green700 },
  saveLabel: { fontSize: 9, color: colors.green600, fontFamily: fonts.regular },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.green600, borderColor: colors.green600 },
  chipText: { fontSize: 11, fontFamily: fonts.medium, color: colors.textSec },
  chipTextActive: { color: 'white', fontFamily: fonts.bold },
  section: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.5 },
  item: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  itemName: { fontSize: 12, fontFamily: fonts.medium, color: colors.text },
  itemStore: { fontSize: 10, color: colors.textMuted, fontFamily: fonts.regular },
  itemReason: { fontSize: 10, color: colors.textMuted, fontFamily: fonts.regular },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dealBadge: { backgroundColor: colors.green50, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  dealText: { fontSize: 9, fontFamily: fonts.bold, color: colors.green700 },
  itemPrice: { fontSize: 12, fontFamily: fonts.bold, color: colors.text },
  totalCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalLabel: { fontSize: 13, color: colors.textSec, fontFamily: fonts.regular },
  totalValue: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  orderBtn: { backgroundColor: colors.green600, borderRadius: radius.md, paddingVertical: 13, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  orderBtnText: { fontSize: 13, fontFamily: fonts.bold, color: 'white' },
});
