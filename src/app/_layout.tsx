import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, DMSans_900Black } from '@expo-google-fonts/dm-sans';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/theme';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
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

    const onWelcome = segments[0] === 'welcome';
    const onLogin = segments[0] === 'login';
    const onOnboarding = segments[0] === 'onboarding';

    // If on welcome screen, don't interfere
    if (onWelcome) {
      setReady(true);
      return;
    }

    // First time: check if welcome was seen
    if (!checkedRef.current) {
      checkedRef.current = true;
      AsyncStorage.getItem('welcome_seen').then((val) => {
        if (!val) {
          router.replace('/welcome');
          setReady(true);
          return;
        }
        // Welcome seen, proceed with auth check
        routeAfterWelcome();
      }).catch(() => routeAfterWelcome());
      return;
    }

    routeAfterWelcome();

    function routeAfterWelcome() {
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

      // Authenticated user — check onboarding status
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
    }
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
    <ErrorBoundary>
      <ThemeContext.Provider value={themeValue}>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </ThemeContext.Provider>
    </ErrorBoundary>
  );
}
