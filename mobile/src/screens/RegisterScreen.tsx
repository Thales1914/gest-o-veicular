import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { getApiErrorMessage } from '../services/api';
import { authService } from '../services/authService';
import type { AuthStackParamList } from '../types/navigation';
import { colors } from '../utils/theme';
import { emailPattern } from '../utils/validators';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError('');

    if (!name.trim() || !email.trim() || !password || !passwordConfirmation) {
      setError('Preencha todos os campos.');
      return;
    }
    if (!emailPattern.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await authService.register({ name: name.trim(), email: email.trim(), password });
      navigation.navigate('Login', { successMessage: 'Conta criada. Agora faça seu login.' });
    } catch (registerError) {
      setError(getApiErrorMessage(registerError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityLabel="Voltar"
                accessibilityRole="button"
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons color={colors.text} name="chevron-back" size={22} />
              </Pressable>
              <Text style={styles.topTitle}>Criar conta</Text>
              <View style={styles.topSpacer} />
            </View>

            <View style={styles.header}>
              <View style={styles.brandIcon}>
                <Ionicons color={colors.text} name="car-sport-outline" size={40} />
              </View>
              <Text style={styles.title}>Olá! Vamos criar sua conta</Text>
              <Text style={styles.subtitle}>Preencha os dados abaixo para começar.</Text>
            </View>

            <View style={styles.formCard}>
              <FeedbackMessage message={error} />
              <FormInput icon="person-outline" label="Nome" onChangeText={setName} placeholder="Seu nome" value={name} />
              <FormInput
                autoCapitalize="none"
                icon="mail-outline"
                keyboardType="email-address"
                label="E-mail"
                onChangeText={setEmail}
                placeholder="voce@exemplo.com"
                value={email}
              />
              <FormInput
                icon="lock-closed-outline"
                label="Senha"
                onChangeText={setPassword}
                placeholder="Mínimo de 6 caracteres"
                secureTextEntry
                value={password}
              />
              <FormInput
                icon="shield-checkmark-outline"
                label="Confirmar senha"
                onChangeText={setPasswordConfirmation}
                onSubmitEditing={handleRegister}
                placeholder="Repita sua senha"
                secureTextEntry
                value={passwordConfirmation}
              />
              <PrimaryButton icon="person-add-outline" title="Criar conta" onPress={handleRegister} loading={loading} />
            </View>

            <Pressable onPress={() => navigation.goBack()} style={styles.linkButton}>
              <Text style={styles.linkMuted}>Já tem conta? <Text style={styles.link}>Entrar</Text></Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 450, gap: 18 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    backgroundColor: colors.surface,
  },
  topTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  topSpacer: { width: 38 },
  header: { alignItems: 'center', gap: 6 },
  brandIcon: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 38,
    backgroundColor: colors.surface,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  formCard: {
    gap: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 17,
    backgroundColor: colors.surface,
  },
  linkButton: { alignItems: 'center', padding: 8 },
  linkMuted: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.text, fontWeight: '800' },
});
