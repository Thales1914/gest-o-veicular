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
import { FeedbackMessage } from '../components/FeedbackMessage';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { getApiErrorMessage } from '../services/api';
import { maintenanceService } from '../services/maintenanceService';
import type { AppStackParamList } from '../types/navigation';
import type { MaintenanceType, OilType } from '../types/maintenanceRecord';
import { parseDecimal, toIsoDate } from '../utils/formatters';
import { maintenanceTypeLabels, oilTypeLabels } from '../utils/maintenanceCalculations';
import { colors, radii } from '../utils/theme';
import { datePattern } from '../utils/validators';

type Props = NativeStackScreenProps<AppStackParamList, 'AddMaintenanceRecord'>;

type FieldErrors = {
  date?: string;
  mileage?: string;
  description?: string;
  cost?: string;
  nextServiceMileage?: string;
};

const maintenanceTypes = Object.keys(maintenanceTypeLabels) as MaintenanceType[];
const oilTypes = Object.keys(oilTypeLabels) as OilType[];

function isValidCalendarDate(brDate: string) {
  const [day, month, year] = brDate.split('/').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

export function AddMaintenanceScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;

  const [type, setType] = useState<MaintenanceType>('oleo');
  const [date, setDate] = useState('');
  const [mileage, setMileage] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [oilType, setOilType] = useState<OilType>('mineral');
  const [nextServiceMileage, setNextServiceMileage] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const isOilChange = type === 'oleo';
  const isReview = type === 'revisao';

  async function handleCreate() {
    setError('');
    const numericMileage = Number(mileage);
    const numericCost = cost ? parseDecimal(cost) : undefined;
    const numericNextServiceMileage = nextServiceMileage ? Number(nextServiceMileage) : undefined;

    const errors: FieldErrors = {};
    if (!date) {
      errors.date = 'Informe a data.';
    } else if (!datePattern.test(date)) {
      errors.date = 'Use o formato DD/MM/AAAA.';
    } else if (!isValidCalendarDate(date)) {
      errors.date = 'Essa data não existe.';
    }
    if (!mileage) {
      errors.mileage = 'Informe a quilometragem.';
    } else if (!Number.isInteger(numericMileage) || numericMileage < 0) {
      errors.mileage = 'Informe uma quilometragem inteira e não negativa.';
    }
    if (!description.trim()) {
      errors.description = 'Descreva o que foi feito.';
    }
    if (cost && (!Number.isFinite(numericCost) || (numericCost ?? 0) < 0)) {
      errors.cost = 'Informe um valor válido.';
    }
    if (nextServiceMileage && (!Number.isInteger(numericNextServiceMileage) || (numericNextServiceMileage ?? 0) < 0)) {
      errors.nextServiceMileage = 'Informe uma quilometragem válida.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await maintenanceService.create(vehicleId, {
        type,
        date: toIsoDate(date),
        mileage: numericMileage,
        description: description.trim(),
        cost: numericCost,
        oil_type: isOilChange ? oilType : undefined,
        next_service_mileage: (isOilChange || isReview) ? numericNextServiceMileage : undefined,
        service_notes: isReview ? (serviceNotes.trim() || undefined) : undefined,
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
              <Ionicons color={colors.text} name="construct-outline" size={38} />
            </View>
            <View style={styles.introText}>
              <Text style={styles.title}>Registrar manutenção</Text>
              <Text style={styles.subtitle}>Essas informações entram no histórico do veículo.</Text>
            </View>
          </View>

          <FeedbackMessage message={error} />
          <View style={styles.formCard}>
            <View style={styles.field}>
              <Text style={styles.label}>Tipo</Text>
              <View style={styles.chipRow}>
                {maintenanceTypes.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: type === item }}
                    onPress={() => setType(item)}
                    style={[styles.chip, type === item ? styles.chipActive : undefined]}
                  >
                    <Text style={[styles.chipText, type === item ? styles.chipTextActive : undefined]}>
                      {maintenanceTypeLabels[item]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {isOilChange ? (
              <View style={styles.field}>
                <Text style={styles.label}>Tipo de óleo</Text>
                <View style={styles.chipRow}>
                  {oilTypes.map((item) => (
                    <Pressable
                      key={item}
                      accessibilityRole="button"
                      accessibilityState={{ selected: oilType === item }}
                      onPress={() => setOilType(item)}
                      style={[styles.chip, oilType === item ? styles.chipActive : undefined]}
                    >
                      <Text style={[styles.chipText, oilType === item ? styles.chipTextActive : undefined]}>
                        {oilTypeLabels[item]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            <FormInput
              error={fieldErrors.date}
              icon="calendar-outline"
              label="Data"
              maxLength={10}
              onChangeText={setDate}
              placeholder="21/09/2026"
              value={date}
            />
            <FormInput
              error={fieldErrors.mileage}
              icon="speedometer-outline"
              keyboardType="number-pad"
              label="Quilometragem"
              onChangeText={setMileage}
              placeholder="45230"
              value={mileage}
            />
            <FormInput
              error={fieldErrors.description}
              icon="document-text-outline"
              label="Descrição"
              onChangeText={setDescription}
              placeholder="Ex: troca de óleo e filtro"
              value={description}
            />
            {isReview ? (
              <FormInput
                icon="checkmark-done-outline"
                label="Itens revisados (opcional)"
                onChangeText={setServiceNotes}
                placeholder="Ex: freios, suspensão, correia"
                value={serviceNotes}
              />
            ) : null}
            {(isOilChange || isReview) ? (
              <FormInput
                error={fieldErrors.nextServiceMileage}
                icon="refresh-outline"
                keyboardType="number-pad"
                label={isOilChange ? 'Próxima troca (km, opcional)' : 'Próxima revisão (km, opcional)'}
                onChangeText={setNextServiceMileage}
                placeholder="50000"
                value={nextServiceMileage}
              />
            ) : null}
            <FormInput
              error={fieldErrors.cost}
              icon="cash-outline"
              keyboardType="decimal-pad"
              label="Valor (opcional)"
              onChangeText={setCost}
              onSubmitEditing={handleCreate}
              placeholder="150,00"
              value={cost}
            />
            <PrimaryButton icon="add-circle-outline" title="Registrar manutenção" onPress={handleCreate} loading={loading} />
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
  field: { gap: 7 },
  label: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.round,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.surface },
});
