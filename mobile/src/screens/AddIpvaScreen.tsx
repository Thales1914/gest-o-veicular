import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { getApiErrorMessage } from '../services/api';
import { ipvaService } from '../services/ipvaService';
import type { IpvaStatus } from '../types/ipva';
import type { AppStackParamList } from '../types/navigation';
import { parseExpenseDate } from '../utils/expensePeriod';
import { formatCurrency, parseDecimal } from '../utils/formatters';
import { colors, radii } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'AddIpva'>;

type FieldErrors = { year?: string; totalValue?: string; installments?: string; dueDate?: string };

export function AddIpvaScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [totalValue, setTotalValue] = useState('');
  const [installments, setInstallments] = useState('1');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<IpvaStatus>('pendente');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const numericYear = Number(year);
  const numericTotal = parseDecimal(totalValue);
  const numericInstallments = Number(installments);
  const showInstallmentValue = numericTotal > 0 && Number.isInteger(numericInstallments) && numericInstallments > 1;

  async function handleCreate() {
    setError('');
    const dueIso = parseExpenseDate(dueDate);

    const errors: FieldErrors = {};
    if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > 2100) errors.year = 'Informe um ano válido.';
    if (!totalValue || !Number.isFinite(numericTotal) || numericTotal <= 0) errors.totalValue = 'Informe o valor total do IPVA.';
    if (!Number.isInteger(numericInstallments) || numericInstallments < 1 || numericInstallments > 12) {
      errors.installments = 'Informe de 1 a 12 parcelas.';
    }
    if (!dueIso) errors.dueDate = 'Use uma data válida no formato DD/MM/AAAA.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !dueIso) return;

    setLoading(true);
    try {
      await ipvaService.create(vehicleId, {
        year: numericYear,
        total_value: Math.round(numericTotal * 100) / 100,
        installments: numericInstallments,
        due_date: dueIso,
        status,
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch (createError) {
      // A API não deixa cadastrar dois IPVAs do mesmo ano para o mesmo carro.
      if (createError instanceof AxiosError && createError.response?.status === 409) {
        setFieldErrors({ year: `Já existe IPVA de ${numericYear} cadastrado para este carro.` });
      } else {
        setError(getApiErrorMessage(createError));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <FeedbackMessage message={error} />
          <View style={styles.formCard}>
            <FormInput error={fieldErrors.year} icon="calendar-outline" keyboardType="number-pad" label="Ano"
              maxLength={4} onChangeText={setYear} placeholder="2026" value={year} />
            <FormInput error={fieldErrors.totalValue} icon="cash-outline" keyboardType="decimal-pad" label="Valor total"
              onChangeText={setTotalValue} placeholder="1500,00" value={totalValue} />
            <FormInput error={fieldErrors.installments} icon="layers-outline" keyboardType="number-pad" label="Parcelas"
              maxLength={2} onChangeText={setInstallments} placeholder="1" value={installments} />
            {showInstallmentValue ? (
              <Text style={styles.hint}>
                {numericInstallments}x de {formatCurrency(Math.round((numericTotal / numericInstallments) * 100) / 100)}
              </Text>
            ) : null}
            <FormInput error={fieldErrors.dueDate} icon="alarm-outline" keyboardType="numbers-and-punctuation"
              label="Vencimento" maxLength={10} onChangeText={setDueDate} placeholder="20/03/2026" value={dueDate} />
            <View style={styles.field}>
              <Text style={styles.label}>Situação</Text>
              <View style={styles.chipRow}>
                {(['pendente', 'pago'] as IpvaStatus[]).map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: status === item }}
                    onPress={() => setStatus(item)}
                    style={[styles.chip, status === item ? styles.chipActive : undefined]}
                  >
                    <Text style={[styles.chipText, status === item ? styles.chipTextActive : undefined]}>
                      {item === 'pago' ? 'Pago' : 'Pendente'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <FormInput icon="create-outline" label="Observações (opcional)" multiline
              onChangeText={setNotes} placeholder="Ex: pago com desconto à vista" value={notes} />
            <PrimaryButton icon="add-circle-outline" title="Salvar IPVA" onPress={handleCreate} loading={loading} />
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
  formCard: {
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 17,
    backgroundColor: colors.surface,
  },
  hint: { marginTop: -6, color: colors.textMuted, fontSize: 13 },
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
