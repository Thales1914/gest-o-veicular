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
import { vehicleService } from '../services/vehicleService';
import type { AppStackParamList } from '../types/navigation';
import { normalizePlate } from '../utils/formatters';
import { colors } from '../utils/theme';
import { platePattern } from '../utils/validators';

type Props = NativeStackScreenProps<AppStackParamList, 'AddVehicle'>;

export function AddVehicleScreen({ navigation }: Props) {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [mileage, setMileage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setError('');
    const normalizedPlate = normalizePlate(plate);
    const numericYear = Number(year);
    const numericMileage = Number(mileage);
    const maximumYear = new Date().getFullYear() + 1;

    if (!brand.trim() || !model.trim() || !year || !plate || !mileage) {
      setError('Preencha todos os campos.');
      return;
    }
    if (!Number.isInteger(numericYear) || numericYear < 1886 || numericYear > maximumYear) {
      setError(`Informe um ano entre 1886 e ${maximumYear}.`);
      return;
    }
    if (!platePattern.test(normalizedPlate)) {
      setError('Use uma placa no formato ABC1234 ou ABC1D23.');
      return;
    }
    if (!Number.isInteger(numericMileage) || numericMileage < 0) {
      setError('Informe uma quilometragem inteira e não negativa.');
      return;
    }

    setLoading(true);
    try {
      await vehicleService.create({
        brand: brand.trim(),
        model: model.trim(),
        year: numericYear,
        plate: normalizedPlate,
        current_mileage: numericMileage,
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
            <View style={styles.carIcon}>
              <Ionicons color={colors.text} name="car-sport-outline" size={38} />
            </View>
            <View style={styles.introText}>
              <Text style={styles.title}>Conte sobre seu carro</Text>
              <Text style={styles.subtitle}>Essas informações aparecem na sua garagem.</Text>
            </View>
          </View>

          <FeedbackMessage message={error} />
          <View style={styles.formCard}>
            <FormInput icon="business-outline" label="Marca" onChangeText={setBrand} placeholder="Honda" value={brand} />
            <FormInput icon="car-outline" label="Modelo" onChangeText={setModel} placeholder="Civic" value={model} />
            <FormInput
              icon="calendar-outline"
              keyboardType="number-pad"
              label="Ano"
              maxLength={4}
              onChangeText={setYear}
              placeholder="2020"
              value={year}
            />
            <FormInput
              autoCapitalize="characters"
              icon="barcode-outline"
              label="Placa"
              maxLength={8}
              onChangeText={setPlate}
              placeholder="ABC1D23"
              value={plate}
            />
            <FormInput
              icon="speedometer-outline"
              keyboardType="number-pad"
              label="Quilometragem atual"
              onChangeText={setMileage}
              onSubmitEditing={handleCreate}
              placeholder="45000"
              value={mileage}
            />
            <PrimaryButton icon="add-circle-outline" title="Cadastrar carro" onPress={handleCreate} loading={loading} />
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
  carIcon: {
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
