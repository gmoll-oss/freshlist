import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, DMSans_900Black } from '@expo-google-fonts/dm-sans';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, DMSans_900Black });
  const { isAuthenticated, loading } = useAuth();

  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.green600} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        {!isAuthenticated ? (
          <Stack.Screen name="login" />
        ) : (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="pantry" />
            <Stack.Screen name="plan" />
            <Stack.Screen name="products" options={{ presentation: 'modal' }} />
            <Stack.Screen name="cook/[id]" options={{ presentation: 'fullScreenModal' }} />
          </>
        )}
      </Stack>
    </>
  );
}
