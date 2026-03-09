import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { colors, fonts, radius } from '../../constants/theme';

const SWIPE_THRESHOLD = -80;
const DELETE_WIDTH = 70;

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export function SwipeToDelete({ children, onDelete }: SwipeToDeleteProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        const dx = isOpen.current ? gesture.dx - DELETE_WIDTH : gesture.dx;
        if (dx <= 0) {
          translateX.setValue(Math.max(dx, -DELETE_WIDTH - 20));
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const dx = isOpen.current ? gesture.dx - DELETE_WIDTH : gesture.dx;
        if (dx < SWIPE_THRESHOLD) {
          // Open delete action
          Animated.spring(translateX, {
            toValue: -DELETE_WIDTH,
            useNativeDriver: true,
            friction: 8,
          }).start();
          isOpen.current = true;
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
          isOpen.current = false;
        }
      },
    }),
  ).current;

  function handleDelete() {
    Animated.timing(translateX, {
      toValue: -400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDelete());
  }

  return (
    <View style={s.container}>
      {/* Delete action behind */}
      <View style={s.deleteAction}>
        <View style={s.deleteBtn} onTouchEnd={handleDelete}>
          <Trash2 size={16} color="white" strokeWidth={2.5} />
          <Text style={s.deleteText}>Borrar</Text>
        </View>
      </View>
      {/* Sliding content */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { overflow: 'hidden' },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.red400,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  deleteText: { fontSize: 10, fontFamily: fonts.bold, color: 'white' },
});
