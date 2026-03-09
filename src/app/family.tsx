import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Users, Mail, UserPlus, Share2 } from 'lucide-react-native';
import { Share } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { inviteFamilyMember } from '../services/supabase/family';

export default function FamilyScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  async function handleInvite() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Email invalido', 'Introduce un email valido');
      return;
    }
    setSending(true);
    try {
      await inviteFamilyMember(trimmed);
      Alert.alert('Invitacion enviada', `Se ha enviado una invitacion a ${trimmed}`);
      setEmail('');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo enviar la invitacion');
    } finally {
      setSending(false);
    }
  }

  async function handleShareLink() {
    try {
      await Share.share({
        message: 'Unete a mi hogar en FreshList! Compartimos despensa y plan de comidas. Descarga la app: https://freshlist.app/invite',
      });
    } catch (_) {}
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mi hogar</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={s.content}>
        <View style={s.heroBox}>
          <View style={s.heroIcon}>
            <Users size={40} color={colors.green600} strokeWidth={1.5} />
          </View>
          <Text style={s.heroTitle}>Comparte con tu familia</Text>
          <Text style={s.heroSub}>
            Invita a tu pareja o companeros de piso. Compartireis la despensa, lista de compra y plan de comidas.
          </Text>
        </View>

        <Text style={s.sectionLabel}>INVITAR POR EMAIL</Text>
        <View style={s.inputRow}>
          <View style={s.inputIcon}>
            <Mail size={16} color={colors.textMuted} strokeWidth={2} />
          </View>
          <TextInput
            style={s.input}
            placeholder="email@ejemplo.com"
            placeholderTextColor={colors.textDim}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={s.sendBtn} onPress={handleInvite} disabled={sending}>
            {sending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <UserPlus size={16} color="white" strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.shareBtn} onPress={handleShareLink}>
          <Share2 size={16} color={colors.green600} strokeWidth={2} />
          <Text style={s.shareBtnText}>Compartir enlace de invitacion</Text>
        </TouchableOpacity>

        <View style={s.infoCard}>
          <Text style={s.infoTitle}>Como funciona</Text>
          <Text style={s.infoItem}>1. Invita por email o comparte el enlace</Text>
          <Text style={s.infoItem}>2. Tu familia descarga FreshList</Text>
          <Text style={s.infoItem}>3. Acepta la invitacion en la app</Text>
          <Text style={s.infoItem}>4. Compartis despensa y plan</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: fonts.black, color: colors.text },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  heroBox: { alignItems: 'center', paddingVertical: 24 },
  heroIcon: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: colors.green50,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  heroTitle: { fontSize: 22, fontFamily: fonts.black, color: colors.text, textAlign: 'center' },
  heroSub: { fontSize: 14, fontFamily: fonts.regular, color: colors.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 11, fontFamily: fonts.bold, color: colors.textMuted, letterSpacing: 0.8, marginBottom: 8, marginTop: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingLeft: 12, marginBottom: 12,
  },
  inputIcon: { marginRight: 4 },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, fontFamily: fonts.regular, color: colors.text },
  sendBtn: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.green600,
    justifyContent: 'center', alignItems: 'center', margin: 4,
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.green50, borderRadius: radius.md, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.green200, marginBottom: 20,
  },
  shareBtnText: { fontSize: 14, fontFamily: fonts.bold, color: colors.green600 },
  infoCard: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  infoTitle: { fontSize: 14, fontFamily: fonts.bold, color: colors.text, marginBottom: 10 },
  infoItem: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSec, lineHeight: 22 },
});
