import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  SlideInRight,
  BounceIn,
  ZoomIn,
  FadeOut,
} from 'react-native-reanimated';
import {
  Apple,
  Trash2,
  ScanLine,
  Camera,
  Sparkles,
  Calendar,
  ShoppingCart,
  Users,
  Tag,
  ChefHat,
  Leaf,
  Check,
  Milk,
  UtensilsCrossed,
  Star,
  Heart,
  MapPin,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { colors, fonts, radius, spacing } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const WELCOME_SEEN_KEY = 'welcome_seen';

/* ─── Screen data ──────────────────────────────────────────── */

interface WelcomeScreen {
  key: string;
  title: string;
  subtitle: string;
  bg: string;
  accentLight: string;
  accent: string;
  accentDark: string;
}

const screens: WelcomeScreen[] = [
  {
    key: 'waste',
    title: 'Deja de tirar comida',
    subtitle: 'El 33% de la comida acaba en la basura. FreshList te ayuda a cambiarlo.',
    bg: '#ECFDF5',
    accentLight: '#D1FAE5',
    accent: '#059669',
    accentDark: '#047857',
  },
  {
    key: 'scan',
    title: 'Escanea y listo',
    subtitle: 'Escanea un ticket o hazle foto a tu nevera. La IA detecta todo al instante.',
    bg: '#F0FDF4',
    accentLight: '#DCFCE7',
    accent: '#10B981',
    accentDark: '#059669',
  },
  {
    key: 'plan',
    title: 'Tu plan semanal en segundos',
    subtitle: 'Recetas personalizadas con lo que ya tienes. Sin pensar, sin desperdiciar.',
    bg: '#ECFDF5',
    accentLight: '#A7F3D0',
    accent: '#059669',
    accentDark: '#047857',
  },
  {
    key: 'shop',
    title: 'Compra solo lo necesario',
    subtitle: 'Lista inteligente, compartida en familia, con ofertas cerca de ti.',
    bg: '#F0FDF4',
    accentLight: '#D1FAE5',
    accent: '#10B981',
    accentDark: '#059669',
  },
];

/* ─── Illustrations ────────────────────────────────────────── */

function WasteIllustration({ visible }: { visible: boolean }) {
  if (!visible) return <View style={styles.illustrationContainer} />;
  return (
    <View style={styles.illustrationContainer}>
      {/* Trash can */}
      <Animated.View
        entering={FadeIn.delay(100).duration(500)}
        style={[styles.iconCircle, { backgroundColor: '#D1FAE5', bottom: 20, alignSelf: 'center' }]}
      >
        <Trash2 size={56} color="#059669" />
      </Animated.View>

      {/* Falling food items caught by hand */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(600)}
        style={{ position: 'absolute', top: 10, left: SCREEN_WIDTH * 0.12 }}
      >
        <View style={[styles.smallCircle, { backgroundColor: '#D1FAE5' }]}>
          <Apple size={32} color="#059669" />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(600).duration(600)}
        style={{ position: 'absolute', top: 0, right: SCREEN_WIDTH * 0.15 }}
      >
        <View style={[styles.smallCircle, { backgroundColor: '#FFEDD5' }]}>
          <Milk size={32} color="#F97316" />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(800).duration(600)}
        style={{ position: 'absolute', top: 30, alignSelf: 'center' }}
      >
        <View style={[styles.smallCircle, { backgroundColor: '#FEF3C7' }]}>
          <UtensilsCrossed size={32} color="#F59E0B" />
        </View>
      </Animated.View>

      {/* Hand catching */}
      <Animated.View
        entering={FadeInUp.delay(1000).duration(500)}
        style={{ position: 'absolute', bottom: 100, alignSelf: 'center' }}
      >
        <View style={[styles.iconCircleMd, { backgroundColor: '#D1FAE5' }]}>
          <Leaf size={44} color="#10B981" />
        </View>
      </Animated.View>

      {/* Stat badge */}
      <Animated.View
        entering={BounceIn.delay(1200).duration(600)}
        style={styles.badge}
      >
        <Text style={styles.badgeText}>33%</Text>
      </Animated.View>
    </View>
  );
}

function ScanIllustration({ visible }: { visible: boolean }) {
  if (!visible) return <View style={styles.illustrationContainer} />;
  return (
    <View style={styles.illustrationContainer}>
      {/* Camera / scan icon */}
      <Animated.View
        entering={ZoomIn.delay(200).duration(500)}
        style={[styles.iconCircleLg, { backgroundColor: '#D1FAE5', alignSelf: 'center' }]}
      >
        <ScanLine size={64} color="#059669" />
      </Animated.View>

      {/* Items appearing one by one */}
      {['Leche', 'Pan', 'Huevos', 'Tomates'].map((item, i) => (
        <Animated.View
          key={item}
          entering={SlideInRight.delay(600 + i * 250).duration(400)}
          style={[styles.listItem, { top: 160 + i * 44 }]}
        >
          <View style={styles.listCheck}>
            <Check size={14} color="#fff" />
          </View>
          <Text style={styles.listText}>{item}</Text>
        </Animated.View>
      ))}

      {/* Camera badge */}
      <Animated.View
        entering={BounceIn.delay(500).duration(500)}
        style={{ position: 'absolute', top: 10, right: SCREEN_WIDTH * 0.12 }}
      >
        <View style={[styles.smallCircle, { backgroundColor: '#A7F3D0' }]}>
          <Camera size={28} color="#059669" />
        </View>
      </Animated.View>
    </View>
  );
}

function PlanIllustration({ visible }: { visible: boolean }) {
  if (!visible) return <View style={styles.illustrationContainer} />;
  return (
    <View style={[styles.illustrationContainer, { alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
      {/* Calendar + sparkles row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Animated.View entering={BounceIn.delay(500).duration(600)}>
          <Sparkles size={24} color="#34D399" />
        </Animated.View>
        <Animated.View
          entering={ZoomIn.delay(200).duration(500)}
          style={[styles.iconCircleLg, { backgroundColor: '#D1FAE5' }]}
        >
          <Calendar size={60} color="#059669" />
        </Animated.View>
        <Animated.View entering={BounceIn.delay(700).duration(600)}>
          <Star size={24} color="#6EE7B7" />
        </Animated.View>
      </View>

      {/* Meal cards */}
      {['Lunes: Pasta al pesto', 'Martes: Ensalada griega', 'Miercoles: Tortilla'].map((meal, i) => (
        <Animated.View
          key={meal}
          entering={FadeInRight.delay(800 + i * 300).duration(400)}
          style={styles.mealCard}
        >
          <ChefHat size={18} color="#059669" />
          <Text style={styles.mealText}>{meal}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

function ShopIllustration({ visible }: { visible: boolean }) {
  if (!visible) return <View style={styles.illustrationContainer} />;
  return (
    <View style={styles.illustrationContainer}>
      {/* Shopping cart */}
      <Animated.View
        entering={ZoomIn.delay(200).duration(500)}
        style={[styles.iconCircleLg, { backgroundColor: '#D1FAE5', alignSelf: 'center' }]}
      >
        <ShoppingCart size={60} color="#059669" />
      </Animated.View>

      {/* Items filling cart */}
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          entering={BounceIn.delay(600 + i * 250).duration(400)}
          style={{
            position: 'absolute',
            top: 30 + i * 20,
            left: SCREEN_WIDTH * 0.2 + i * 30,
          }}
        >
          <View style={[styles.tinyCircle, { backgroundColor: i === 0 ? '#A7F3D0' : i === 1 ? '#FDE68A' : '#FBCFE8' }]}>
            <Leaf size={16} color={i === 0 ? '#059669' : i === 1 ? '#D97706' : '#DB2777'} />
          </View>
        </Animated.View>
      ))}

      {/* Price tag with savings */}
      <Animated.View
        entering={FadeInRight.delay(1000).duration(500)}
        style={[styles.savingsBadge, { top: 160 }]}
      >
        <Tag size={18} color="#059669" />
        <Text style={styles.savingsText}>Ahorra un 25%</Text>
      </Animated.View>

      {/* Family icons */}
      <Animated.View
        entering={FadeIn.delay(1300).duration(500)}
        style={{ position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', gap: 12, alignItems: 'center' }}
      >
        <View style={[styles.smallCircle, { backgroundColor: '#DBEAFE' }]}>
          <Users size={24} color="#3B82F6" />
        </View>
        <View style={[styles.smallCircle, { backgroundColor: '#FCE7F3' }]}>
          <Heart size={24} color="#EC4899" />
        </View>
        <View style={[styles.smallCircle, { backgroundColor: '#FEF3C7' }]}>
          <MapPin size={24} color="#D97706" />
        </View>
      </Animated.View>
    </View>
  );
}

const ILLUSTRATIONS = [WasteIllustration, ScanIllustration, PlanIllustration, ShopIllustration];

/* ─── Main component ───────────────────────────────────────── */

export default function WelcomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([0]));

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== page) {
      setPage(idx);
      setVisitedPages((prev) => new Set(prev).add(idx));
    }
  }, [page]);

  const finish = useCallback(async () => {
    await AsyncStorage.setItem(WELCOME_SEEN_KEY, 'true');
    router.replace('/login');
  }, [router]);

  const next = useCallback(() => {
    if (page < screens.length - 1) {
      const nextPage = page + 1;
      scrollRef.current?.scrollTo({ x: nextPage * SCREEN_WIDTH, animated: true });
      setPage(nextPage);
      setVisitedPages((prev) => new Set(prev).add(nextPage));
    } else {
      finish();
    }
  }, [page, finish]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  const isLast = page === screens.length - 1;
  const current = screens[page];

  return (
    <View style={[styles.root, { backgroundColor: current.bg }]}>
      <SafeAreaView style={styles.safe}>
        {/* Skip */}
        <TouchableOpacity style={styles.skipBtn} onPress={skip} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: current.accentDark }]}>Saltar</Text>
        </TouchableOpacity>

        {/* Swipeable pages */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={styles.scroller}
        >
          {screens.map((screen, idx) => {
            const Illustration = ILLUSTRATIONS[idx];
            return (
              <View key={screen.key} style={styles.page}>
                {/* Illustration area */}
                <View style={styles.illustrationWrapper}>
                  <Illustration visible={visitedPages.has(idx)} />
                </View>

                {/* Text */}
                <View style={styles.textArea}>
                  <Text style={[styles.title, { color: screen.accentDark }]}>{screen.title}</Text>
                  <Text style={styles.subtitle}>{screen.subtitle}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Dots + Buttons */}
        <View style={styles.footer}>
          {/* Dot indicators */}
          <View style={styles.dots}>
            {screens.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor: idx === page ? current.accent : current.accentLight,
                    width: idx === page ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Next / Empezar button */}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: current.accent }]}
            onPress={next}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>{isLast ? 'Empezar' : 'Siguiente'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  skipText: {
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  scroller: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  illustrationWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: SCREEN_HEIGHT * 0.38,
  },
  illustrationContainer: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.35,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.black,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#57534E',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: radius.full,
  },
  nextBtn: {
    height: 54,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#FFFFFF',
  },

  /* Illustration helpers */
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleMd: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleLg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tinyCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 5,
    left: SCREEN_WIDTH * 0.08,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  listItem: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    width: SCREEN_WIDTH * 0.55,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  listCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#1C1917',
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.md,
    width: SCREEN_WIDTH * 0.75,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  mealText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#1C1917',
    flex: 1,
  },
  savingsBadge: {
    position: 'absolute',
    left: SCREEN_WIDTH * 0.08,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.full,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  savingsText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#059669',
  },
});
