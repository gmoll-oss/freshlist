import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Share,
} from 'react-native';
import { Alert } from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Users, Share2, LogOut, UserPlus, Crown, User } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import {
  createFamily,
  joinFamily,
  getMyFamily,
  leaveFamily,
  type MyFamily,
} from '../services/supabase/family';

export default function FamilyScreen() {
  const router = useRouter();
  const [family, setFamily] = useState<MyFamily | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Create form
  const [familyName, setFamilyName] = useState('');
  // Join form
  const [inviteCode, setInviteCode] = useState('');

  const loadFamily = useCallback(async () => {
    try {
      const data = await getMyFamily();
      setFamily(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFamily();
  }, [loadFamily]);

  async function handleCreate() {
    const name = familyName.trim();
    if (!name) {
      Alert.alert('Nombre requerido', 'Introduce un nombre para tu hogar');
      return;
    }
    setActionLoading(true);
    try {
      const result = await createFamily(name);
      setFamily(result);
      setFamilyName('');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo crear el hogar');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleJoin() {
    const code = inviteCode.trim();
    if (!code || code.length < 6) {
      Alert.alert('Codigo invalido', 'Introduce un codigo de 6 caracteres');
      return;
    }
    setActionLoading(true);
    try {
      const result = await joinFamily(code);
      setFamily(result);
      setInviteCode('');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo unir al hogar');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    Alert.alert(
      'Salir del hogar',
      family?.group.owner_id
        ? 'Si sales, se eliminara el hogar para todos los miembros. Estas seguro?'
        : 'Estas seguro de que quieres salir del hogar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await leaveFamily();
              setFamily(null);
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'No se pudo salir del hogar');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  }

  async function handleCopyCode() {
    if (!family) return;
    try {
      await Share.share({
        message: family.group.invite_code,
      });
    } catch {
      // user cancelled
    }
  }

  async function handleShareCode() {
    if (!family) return;
    try {
      await Share.share({
        message: `Unete a mi hogar "${family.group.name}" en FreshList! Usa el codigo: ${family.group.invite_code}`,
      });
    } catch {
      // user cancelled
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Mi hogar</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.green600} size="large" />
        </View>
      </SafeAreaView>
    );
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

      <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {!family ? (
          /* ── No family: show create + join ── */
          <>
            <View style={s.heroBox}>
              <View style={s.heroIcon}>
                <Users size={40} color={colors.green600} strokeWidth={1.5} />
              </View>
              <Text style={s.heroTitle}>Comparte con tu familia</Text>
              <Text style={s.heroSub}>
                Crea un hogar o unete a uno existente. Compartireis la lista de la compra en tiempo real.
              </Text>
            </View>

            {/* Create */}
            <Text style={s.sectionLabel}>CREAR HOGAR</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                placeholder="Nombre del hogar (ej: Casa Garcia)"
                placeholderTextColor={colors.textDim}
                value={familyName}
                onChangeText={setFamilyName}
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={s.actionBtn}
                onPress={handleCreate}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={s.actionBtnText}>Crear</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Join */}
            <Text style={[s.sectionLabel, { marginTop: 20 }]}>UNIRSE CON CODIGO</Text>
            <View style={s.inputRow}>
              <TextInput
                style={[s.input, { letterSpacing: 3, fontFamily: fonts.bold, textAlign: 'center' }]}
                placeholder="ABC123"
                placeholderTextColor={colors.textDim}
                value={inviteCode}
                onChangeText={(t) => setInviteCode(t.toUpperCase().slice(0, 6))}
                autoCapitalize="characters"
                maxLength={6}
              />
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: colors.green500 }]}
                onPress={handleJoin}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <UserPlus size={16} color="white" strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>

            <View style={s.infoCard}>
              <Text style={s.infoTitle}>Como funciona</Text>
              <Text style={s.infoItem}>1. Crea un hogar o pidele el codigo a alguien</Text>
              <Text style={s.infoItem}>2. Comparte el codigo de 6 letras</Text>
              <Text style={s.infoItem}>3. Todos ven la misma lista de la compra</Text>
              <Text style={s.infoItem}>4. Anade y tacha productos en tiempo real</Text>
            </View>
          </>
        ) : (
          /* ── Has family: show info ── */
          <>
            {/* Family name & icon */}
            <View style={s.heroBox}>
              <View style={s.heroIcon}>
                <Users size={40} color={colors.green600} strokeWidth={1.5} />
              </View>
              <Text style={s.heroTitle}>{family.group.name}</Text>
              <Text style={s.heroSub}>
                {family.members.length} {family.members.length === 1 ? 'miembro' : 'miembros'}
              </Text>
            </View>

            {/* Invite code card */}
            <Text style={s.sectionLabel}>CODIGO DE INVITACION</Text>
            <View style={s.codeCard}>
              <Text style={s.codeText}>{family.group.invite_code}</Text>
              <View style={s.codeActions}>
                <TouchableOpacity style={s.codeBtn} onPress={handleCopyCode}>
                  <Share2 size={16} color={colors.green600} strokeWidth={2} />
                  <Text style={s.codeBtnText}>Copiar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.codeBtn} onPress={handleShareCode}>
                  <UserPlus size={16} color={colors.green600} strokeWidth={2} />
                  <Text style={s.codeBtnText}>Compartir</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Members list */}
            <Text style={[s.sectionLabel, { marginTop: 20 }]}>MIEMBROS</Text>
            <View style={s.membersCard}>
              {family.members.map((member) => (
                <View key={member.id} style={s.memberRow}>
                  <View style={[s.memberAvatar, member.role === 'owner' && s.memberAvatarOwner]}>
                    {member.role === 'owner' ? (
                      <Crown size={16} color={colors.green600} strokeWidth={2} />
                    ) : (
                      <User size={16} color={colors.textMuted} strokeWidth={2} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.memberName}>
                      {member.display_name ?? 'Miembro'}
                    </Text>
                    <Text style={s.memberRole}>
                      {member.role === 'owner' ? 'Propietario' : 'Miembro'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Leave button */}
            <TouchableOpacity
              style={s.leaveBtn}
              onPress={handleLeave}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={colors.red500} size="small" />
              ) : (
                <>
                  <LogOut size={16} color={colors.red500} strokeWidth={2} />
                  <Text style={s.leaveBtnText}>Salir del hogar</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: fonts.black, color: colors.text },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  heroBox: { alignItems: 'center', paddingVertical: 24 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.green50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: fonts.black,
    color: colors.text,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  actionBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.green600,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: 'white',
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 10,
  },
  infoItem: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSec,
    lineHeight: 22,
  },

  /* ── Family view styles ── */
  codeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 32,
    fontFamily: fonts.black,
    color: colors.green600,
    letterSpacing: 6,
    marginBottom: 16,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.green50,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.green200,
  },
  codeBtnText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.green600,
  },
  membersCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarOwner: {
    backgroundColor: colors.green50,
  },
  memberName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  memberRole: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.red50,
    borderRadius: radius.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.red100,
    marginTop: 24,
  },
  leaveBtnText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.red500,
  },
});
