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
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../services/api';
import type { AuthStackParamList } from '../types/navigation';
import { colors } from '../utils/theme';
import { emailPattern } from '../utils/validators';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation, route }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');

    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    if (!emailPattern.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
    } catch (loginError) {
      setError(getApiErrorMessage(loginError));
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
            <View style={styles.header}>
              <View style={styles.brandIcon}>
                <Ionicons color={colors.text} name="car-sport-outline" size={48} />
              </View>
              <Text style={styles.title}>Bem-vindo!</Text>
              <Text style={styles.subtitle}>Faça login para continuar</Text>
            </View>

            <View style={styles.formCard}>
              <FeedbackMessage message={route.params?.successMessage} type="success" />
              <FeedbackMessage message={error} />
              <FormInput
                autoCapitalize="none"
                autoComplete="email"
                icon="mail-outline"
                keyboardType="email-address"
                label="E-mail"
                onChangeText={setEmail}
                placeholder="voce@exemplo.com"
                returnKeyType="next"
                value={email}
              />
              <FormInput
                autoComplete="password"
                icon="lock-closed-outline"
                label="Senha"
                onChangeText={setPassword}
                onSubmitEditing={handleLogin}
                placeholder="Sua senha"
                returnKeyType="done"
                secureTextEntry
                value={password}
              />
              <Text style={styles.helper}>Esqueceu sua senha? Recurso disponível em breve.</Text>
              <PrimaryButton icon="log-in-outline" title="Entrar" onPress={handleLogin} loading={loading} />
            </View>

            <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkButton}>
              <Text style={styles.linkMuted}>Não tem conta? <Text style={styles.link}>Cadastre-se</Text></Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  content: { width: '100%', maxWidth: 430, gap: 22 },
  header: { alignItems: 'center', gap: 7 },
  brandIcon: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 46,
    backgroundColor: colors.surface,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14 },
  formCard: {
    gap: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    backgroundColor: colors.surface,
  },
  helper: { marginTop: -5, color: colors.textSubtle, fontSize: 11, textAlign: 'right' },
  linkButton: { alignItems: 'center', padding: 8 },
  linkMuted: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.text, fontWeight: '800' },
});
