import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Leaf, Receipt, Camera } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.container}>
        <View style={s.iconBox}>
          <Leaf size={40} color={colors.green600} strokeWidth={1.5} />
        </View>
        <Text style={s.title}>Bienvenido a FreshList</Text>
        <Text style={s.subtitle}>
          Tu despensa digital que se mantiene sola.{'\n'}
          Escanea tu primer ticket o haz una foto{'\n'}
          a tu nevera para empezar.
        </Text>

        <View style={s.buttons}>
          <TouchableOpacity style={s.primaryBtn} onPress={() => router.replace('/(tabs)/scan')}>
            <Receipt size={18} color="white" strokeWidth={2.5} />
            <Text style={s.primaryText}>Escanear ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => router.replace('/(tabs)/scan')}>
            <Camera size={18} color={colors.green600} strokeWidth={2.5} />
            <Text style={s.secondaryText}>Foto de mi nevera</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.note}>Sin registro. Resultados en 15 segundos.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  iconBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.green50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontFamily: fonts.black, color: colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.regular, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  buttons: { width: '100%', gap: 10 },
  primaryBtn: { backgroundColor: colors.green600, borderRadius: radius.lg, paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  primaryText: { fontSize: 15, fontFamily: fonts.bold, color: 'white' },
  secondaryBtn: { backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 2, borderColor: colors.green200 },
  secondaryText: { fontSize: 15, fontFamily: fonts.bold, color: colors.green600 },
  note: { fontSize: 11, color: colors.textDim, fontFamily: fonts.regular, marginTop: 20 },
});
