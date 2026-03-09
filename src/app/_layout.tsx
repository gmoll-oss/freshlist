import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, DMSans_900Black } from '@expo-google-fonts/dm-sans';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { colors } from '../constants/theme';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { fetchPreferences } from '../services/supabase/preferences';
import { useNotifications } from '../hooks/useNotifications';
import { ThemeContext, useThemeProvider, useTheme } from '../hooks/useTheme';

function AuthGate() {
  const { isAuthenticated, loading, skipped } = useAuth();
  const { isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const checkedRef = useRef(false);

  // Initialize local notifications (expiry alerts, cook reminders)
  useNotifications();

  useEffect(() => {
    if (loading) return;

    const onLogin = segments[0] === 'login';
    const onOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !onLogin) {
      router.replace('/login');
      setReady(true);
      return;
    }

    if (!isAuthenticated) {
      setReady(true);
      return;
    }

    // Skip auth: go straight to tabs
    if (skipped) {
      if (onLogin) router.replace('/(tabs)');
      setReady(true);
      return;
    }

    // Already checked onboarding — don't re-check on every segment change
    if (checkedRef.current) {
      setReady(true);
      return;
    }

    // Authenticated user — check onboarding status once
    checkedRef.current = true;
    fetchPreferences()
      .then((prefs) => {
        if (prefs?.onboarding_done) {
          if (onLogin || onOnboarding) router.replace('/(tabs)');
        } else {
          if (!onOnboarding) router.replace('/onboarding');
        }
      })
      .catch(() => {
        if (!onOnboarding) router.replace('/onboarding');
      })
      .finally(() => setReady(true));
  }, [isAuthenticated, loading, segments]);

  if (loading || !ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.green600} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, DMSans_900Black });
  const themeValue = useThemeProvider();

  if (!fontsLoaded || !themeValue.loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.green600} />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={themeValue}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeContext.Provider>
  );
}
