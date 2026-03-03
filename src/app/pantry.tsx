import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../constants/theme';

export default function PantryScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontFamily: fonts.black, color: colors.text }}>Despensa</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 4 }}>
          Próximamente — gestión completa de tu despensa
        </Text>
      </View>
    </SafeAreaView>
  );
}
