import { View, Text, StyleSheet } from 'react-native';
import { Leaf } from 'lucide-react-native';
import { colors, fonts } from '../../constants/theme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const SIZES = {
  sm: { icon: 24, circle: 40, text: 18, radius: 12 },
  md: { icon: 36, circle: 64, text: 28, radius: 20 },
  lg: { icon: 52, circle: 96, text: 38, radius: 28 },
};

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const s = SIZES[size];

  return (
    <View style={styles.container}>
      <View style={[styles.circle, {
        width: s.circle,
        height: s.circle,
        borderRadius: s.radius,
      }]}>
        <Leaf size={s.icon} color="#FFFFFF" strokeWidth={2} />
      </View>
      {showText && (
        <Text style={[styles.text, { fontSize: s.text }]}>
          Fresh<Text style={styles.textBold}>List</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  circle: {
    backgroundColor: colors.green600,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    fontFamily: fonts.regular,
    color: colors.text,
  },
  textBold: {
    fontFamily: fonts.black,
  },
});
