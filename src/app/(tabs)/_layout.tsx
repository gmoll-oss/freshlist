import { Tabs } from 'expo-router';
import { colors, fonts } from '../../constants/theme';
import { Home, ScanLine, Package, ShoppingCart, Trophy } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green600,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: fonts.medium },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: 'Inicio',
        tabBarAccessibilityLabel: 'Inicio',
        tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={2} />,
      }} />
      <Tabs.Screen name="scan" options={{
        title: 'Escanear',
        tabBarAccessibilityLabel: 'Escanear ticket o nevera',
        tabBarIcon: ({ color, size }) => <ScanLine size={size} color={color} strokeWidth={2} />,
      }} />
      <Tabs.Screen name="pantry" options={{
        title: 'Despensa',
        tabBarAccessibilityLabel: 'Ver despensa',
        tabBarIcon: ({ color, size }) => <Package size={size} color={color} strokeWidth={2} />,
      }} />
      <Tabs.Screen name="shopping" options={{
        title: 'Compra',
        tabBarAccessibilityLabel: 'Lista de compra',
        tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} strokeWidth={2} />,
      }} />
      <Tabs.Screen name="stats" options={{
        title: 'Logros',
        tabBarAccessibilityLabel: 'Tus logros y estadisticas',
        tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} strokeWidth={2} />,
      }} />
    </Tabs>
  );
}
