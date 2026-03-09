import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Send, Trash2 } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useChat, ChatMessage } from '../hooks/useChat';

const QUICK_SUGGESTIONS = [
  'Que cocino hoy?',
  'Marca algo como usado',
  'No me apetece cocinar mucho',
  'Cambia la cena de manana',
  'Que caduca pronto?',
];

function ThinkingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    function animate(dot: Animated.Value, delay: number) {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ]),
      ).start();
    }
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  return (
    <View style={s.thinkingRow}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            s.thinkingDot,
            { opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
          ]}
        />
      ))}
    </View>
  );
}

function renderFormattedText(text: string, isUser: boolean) {
  // Split by **bold** markers and bullet points
  const baseStyle = isUser ? s.bubbleTextUser : s.bubbleTextAssistant;
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');

  lines.forEach((line, li) => {
    if (li > 0) parts.push(<Text key={`br-${li}`}>{'\n'}</Text>);

    // Bullet points
    const trimmed = line.trimStart();
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ') || /^\d+\.\s/.test(trimmed);
    if (isBullet && !isUser) {
      const bulletText = trimmed.replace(/^[-•]\s|^\d+\.\s/, '');
      parts.push(
        <Text key={`bullet-${li}`} style={baseStyle}>
          {'  '}
          <Text style={{ color: colors.green600 }}>{'•'}</Text>
          {' '}
        </Text>,
      );
      // Process bold within bullet
      addBoldSegments(bulletText, li, parts, isUser);
      return;
    }

    // Regular line with possible bold
    addBoldSegments(line, li, parts, isUser);
  });

  return parts;
}

function addBoldSegments(text: string, lineIdx: number, parts: React.ReactNode[], isUser: boolean) {
  const baseStyle = isUser ? s.bubbleTextUser : s.bubbleTextAssistant;
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIdx = 0;
  let match;
  let segIdx = 0;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(<Text key={`t-${lineIdx}-${segIdx++}`} style={baseStyle}>{text.slice(lastIdx, match.index)}</Text>);
    }
    parts.push(
      <Text key={`b-${lineIdx}-${segIdx++}`} style={[baseStyle, { fontFamily: fonts.bold }]}>
        {match[1]}
      </Text>,
    );
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(<Text key={`t-${lineIdx}-${segIdx}`} style={baseStyle}>{text.slice(lastIdx)}</Text>);
  }
}

const MessageBubble = React.memo(function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[s.bubbleWrap, isUser ? s.bubbleWrapUser : s.bubbleWrapAssistant]}>
      <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAssistant]}>
        <Text style={[s.bubbleText, isUser ? s.bubbleTextUser : s.bubbleTextAssistant]}>
          {renderFormattedText(msg.content, isUser)}
        </Text>
      </View>
    </View>
  );
});

export default function ChatScreen() {
  const router = useRouter();
  const { messages, status, error, sendMessage, clearHistory, loadContext } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, status]);

  function handleSend() {
    if (!input.trim() || status === 'thinking') return;
    sendMessage(input);
    setInput('');
  }

  function handleQuickSuggestion(text: string) {
    if (status === 'thinking') return;
    sendMessage(text);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={s.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Asistente</Text>
        <TouchableOpacity onPress={clearHistory} style={s.backBtn}>
          <Trash2 size={18} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={s.messageList}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>Tu asistente de cocina</Text>
              <Text style={s.emptySub}>
                Preguntame que cocinar, que caduca pronto o pide cambios en tu plan
              </Text>
            </View>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {status === 'thinking' && (
            <View style={[s.bubbleWrap, s.bubbleWrapAssistant]}>
              <View style={[s.bubble, s.bubbleAssistant]}>
                <ThinkingDots />
              </View>
            </View>
          )}

          {error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Quick suggestions */}
        {messages.length === 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.suggestionsRow}
          >
            {QUICK_SUGGESTIONS.map((text) => (
              <TouchableOpacity
                key={text}
                style={s.suggestionChip}
                onPress={() => handleQuickSuggestion(text)}
              >
                <Text style={s.suggestionText}>{text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.textDim}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || status === 'thinking') && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!input.trim() || status === 'thinking'}
            accessibilityLabel="Enviar mensaje"
            accessibilityRole="button"
          >
            <Send size={18} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: fonts.black, color: colors.text },

  messageList: { flex: 1 },

  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, marginBottom: 8 },
  emptySub: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },

  // Bubbles
  bubbleWrap: { marginBottom: 8 },
  bubbleWrapUser: { alignItems: 'flex-end' },
  bubbleWrapAssistant: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, padding: 12, paddingHorizontal: 14 },
  bubbleUser: { backgroundColor: colors.green600, borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 },
  bubbleTextUser: { color: 'white' },
  bubbleTextAssistant: { color: colors.text },

  // Thinking
  thinkingRow: { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  thinkingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted },

  // Error
  errorBox: { backgroundColor: colors.red50, borderRadius: radius.md, padding: 10, marginTop: 4 },
  errorText: { fontSize: 12, fontFamily: fonts.medium, color: colors.red500 },

  // Suggestions
  suggestionsRow: { paddingHorizontal: spacing.lg, paddingBottom: 8, gap: 8 },
  suggestionChip: {
    backgroundColor: colors.card, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  suggestionText: { fontSize: 13, fontFamily: fonts.medium, color: colors.green700 },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    paddingHorizontal: 14, paddingVertical: 10, paddingTop: 10,
    fontSize: 14, fontFamily: fonts.regular, color: colors.text,
    maxHeight: 100, minHeight: 40,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.green600,
    justifyContent: 'center', alignItems: 'center',
  },
});
