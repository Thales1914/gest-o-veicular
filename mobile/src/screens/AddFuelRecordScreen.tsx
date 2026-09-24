import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { getApiErrorMessage } from '../services/api';
import { fuelService } from '../services/fuelService';
import type { AppStackParamList } from '../types/navigation';
import { parseDecimal, toIsoDate } from '../utils/formatters';
import { colors } from '../utils/theme';
import { datePattern } from '../utils/validators';

type Props = NativeStackScreenProps<AppStackParamList, 'AddFuelRecord'>;

export function AddFuelRecordScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;

  const [date, setDate] = useState('');
  const [mileage, setMileage] = useState('');
  const [liters, setLiters] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setError('');
    const numericMileage = Number(mileage);
    const numericLiters = parseDecimal(liters);
    const numericTotalPrice = parseDecimal(totalPrice);

    if (!date || !mileage || !liters || !totalPrice) {
      setError('Preencha todos os campos.');
      return;
    }
    if (!datePattern.test(date)) {
      setError('Use uma data no formato DD/MM/AAAA.');
      return;
    }
    if (!Number.isInteger(numericMileage) || numericMileage < 0) {
      setError('Informe uma quilometragem inteira e não negativa.');
      return;
    }
    if (!Number.isFinite(numericLiters) || numericLiters <= 0) {
      setError('Informe uma quantidade de litros válida.');
      return;
    }
    if (!Number.isFinite(numericTotalPrice) || numericTotalPrice <= 0) {
      setError('Informe um valor total válido.');
      return;
    }

    setLoading(true);
    try {
      await fuelService.create(vehicleId, {
        date: toIsoDate(date),
        mileage: numericMileage,
        liters: numericLiters,
        total_price: numericTotalPrice,
      });
      navigation.goBack();
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.intro}>
            <View style={styles.iconBox}>
              <Ionicons color={colors.text} name="water-outline" size={38} />
            </View>
            <View style={styles.introText}>
              <Text style={styles.title}>Registrar abastecimento</Text>
              <Text style={styles.subtitle}>Essas informações entram no histórico do veículo.</Text>
            </View>
          </View>

          <FeedbackMessage message={error} />
          <View style={styles.formCard}>
            <FormInput
              icon="calendar-outline"
              label="Data"
              maxLength={10}
              onChangeText={setDate}
              placeholder="21/09/2026"
              value={date}
            />
            <FormInput
              icon="speedometer-outline"
              keyboardType="number-pad"
              label="Quilometragem no abastecimento"
              onChangeText={setMileage}
              placeholder="45230"
              value={mileage}
            />
            <FormInput
              icon="water-outline"
              keyboardType="decimal-pad"
              label="Litros"
              onChangeText={setLiters}
              placeholder="40,5"
              value={liters}
            />
            <FormInput
              icon="cash-outline"
              keyboardType="decimal-pad"
              label="Valor total (R$)"
              onChangeText={setTotalPrice}
              onSubmitEditing={handleCreate}
              placeholder="250,00"
              value={totalPrice}
            />
            <PrimaryButton icon="add-circle-outline" title="Registrar abastecimento" onPress={handleCreate} loading={loading} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, alignItems: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 520, gap: 18 },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.surface,
  },
  iconBox: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: colors.surfaceMuted,
  },
  introText: { flex: 1, gap: 4 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  formCard: {
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 17,
    backgroundColor: colors.surface,
  },
});
