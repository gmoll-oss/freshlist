import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.container}>
          <Text style={s.emoji}>😵</Text>
          <Text style={s.title}>Algo ha fallado</Text>
          <Text style={s.message}>
            {this.state.error?.message ?? 'Error inesperado'}
          </Text>
          <TouchableOpacity style={s.btn} onPress={this.handleRetry}>
            <Text style={s.btnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: spacing.xl,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontFamily: fonts.black, color: colors.text, marginBottom: 8 },
  message: {
    fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted,
    textAlign: 'center', lineHeight: 20, marginBottom: 24,
  },
  btn: {
    backgroundColor: colors.green600, borderRadius: radius.md,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  btnText: { fontSize: 15, fontFamily: fonts.bold, color: 'white' },
});
