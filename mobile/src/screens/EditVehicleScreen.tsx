import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

type Props = NativeStackScreenProps<AppStackParamList, 'EditVehicle'>;

type FieldErrors = { brand?: string; model?: string; year?: string; plate?: string; mileage?: string };

export function EditVehicleScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plate, setPlate] = useState('');
  const [mileage, setMileage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadVehicle = useCallback(async () => {
    setLoadingVehicle(true);
    setError('');
    try {
      const vehicle = await vehicleService.detail(vehicleId);
      setBrand(vehicle.brand);
      setModel(vehicle.model);
      setYear(String(vehicle.year));
      setPlate(vehicle.plate);
      setMileage(String(vehicle.current_mileage));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoadingVehicle(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  async function handleSave() {
    setError('');
    const normalizedPlate = normalizePlate(plate);
    const numericYear = Number(year);
    const numericMileage = Number(mileage);
    const maximumYear = new Date().getFullYear() + 1;

    const errors: FieldErrors = {};
    if (!brand.trim()) errors.brand = 'Informe a marca.';
    if (!model.trim()) errors.model = 'Informe o modelo.';
    if (!year) {
      errors.year = 'Informe o ano.';
    } else if (!Number.isInteger(numericYear) || numericYear < 1886 || numericYear > maximumYear) {
      errors.year = `Informe um ano entre 1886 e ${maximumYear}.`;
    }
    if (!plate) {
      errors.plate = 'Informe a placa.';
    } else if (!platePattern.test(normalizedPlate)) {
      errors.plate = 'Use uma placa no formato ABC1234 ou ABC1D23.';
    }
    if (!mileage) {
      errors.mileage = 'Informe a quilometragem.';
    } else if (!Number.isInteger(numericMileage) || numericMileage < 0) {
      errors.mileage = 'Informe uma quilometragem inteira e não negativa.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await vehicleService.update(vehicleId, {
        brand: brand.trim(),
        model: model.trim(),
        year: numericYear,
        plate: normalizedPlate,
        current_mileage: numericMileage,
      });
      navigation.goBack();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  if (loadingVehicle) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
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
              <Ionicons color={colors.text} name="create-outline" size={38} />
            </View>
            <View style={styles.introText}>
              <Text style={styles.title}>Editar carro</Text>
              <Text style={styles.subtitle}>Atualize os dados do seu veículo.</Text>
            </View>
          </View>

          <FeedbackMessage message={error} />
          <View style={styles.formCard}>
            <FormInput error={fieldErrors.brand} icon="business-outline" label="Marca" onChangeText={setBrand} placeholder="Honda" value={brand} />
            <FormInput error={fieldErrors.model} icon="car-outline" label="Modelo" onChangeText={setModel} placeholder="Civic" value={model} />
            <FormInput
              error={fieldErrors.year}
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
              error={fieldErrors.plate}
              icon="barcode-outline"
              label="Placa"
              maxLength={8}
              onChangeText={setPlate}
              placeholder="ABC1D23"
              value={plate}
            />
            <FormInput
              error={fieldErrors.mileage}
              icon="speedometer-outline"
              keyboardType="number-pad"
              label="Quilometragem atual"
              onChangeText={setMileage}
              onSubmitEditing={handleSave}
              placeholder="45000"
              value={mileage}
            />
            <PrimaryButton icon="checkmark-circle-outline" title="Salvar alterações" onPress={handleSave} loading={saving} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
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
