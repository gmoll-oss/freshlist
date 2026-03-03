import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../constants/theme';

export default function PlanScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontFamily: fonts.black, color: colors.text }}>Plan Semanal</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, fontFamily: fonts.regular, marginTop: 4 }}>
          Próximamente — plan de comidas generado por IA
        </Text>
      </View>
    </SafeAreaView>
  );
}
