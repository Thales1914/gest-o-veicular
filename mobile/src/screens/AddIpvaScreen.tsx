import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { getApiErrorMessage } from '../services/api';
import { ipvaService } from '../services/ipvaService';
import type { CreateIpvaInput, IpvaStatus } from '../types/ipva';
import type { AppStackParamList } from '../types/navigation';
import { parseExpenseDate } from '../utils/expensePeriod';
import { formatCurrency, formatDateBR, parseDecimal } from '../utils/formatters';
import { makeIpvaSchedule } from '../utils/ipvaSchedule';
import { colors, radii } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'AddIpva'>;
type FieldErrors = { year?: string; totalValue?: string; installments?: string; dueDate?: string; schedule?: string };
type Override = { date?: string; status?: IpvaStatus };

export function AddIpvaScreen({ route, navigation }: Props) {
  const { vehicleId, ipvaId } = route.params;
  const editing = Boolean(ipvaId);
  const [year, setYear] = useState(editing ? '' : String(new Date().getFullYear()));
  const [totalValue, setTotalValue] = useState('');
  const [installments, setInstallments] = useState('1');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<IpvaStatus>('pendente');
  const [notes, setNotes] = useState('');
  const [overrides, setOverrides] = useState<Record<number, Override>>({});
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(editing);
  const saving = useRef(false);

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Editar IPVA' : 'Cadastrar IPVA' });
  }, [editing, navigation]);

  const loadRecord = useCallback(async () => {
    if (!ipvaId) return;
    setLoadingRecord(true);
    setError('');
    try {
      const record = await ipvaService.detail(vehicleId, ipvaId);
      setYear(String(record.year));
      setTotalValue(record.total_value.toFixed(2).replace('.', ','));
      setInstallments(String(record.installments));
      setDueDate(formatDateBR(record.due_date));
      setStatus(record.status);
      setNotes(record.notes ?? '');
      setOverrides(Object.fromEntries(record.installment_details.map((item) => [
        item.number,
        { date: formatDateBR(item.due_date), status: item.status },
      ])));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoadingRecord(false);
    }
  }, [ipvaId, vehicleId]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  const numericYear = Number(year);
  const numericTotal = parseDecimal(totalValue);
  const numericInstallments = Number(installments);
  const schedule = makeIpvaSchedule(numericTotal, numericInstallments, parseExpenseDate(dueDate) ?? '', status);

  async function handleSave() {
    if (saving.current) return;
    setError('');
    const dueIso = parseExpenseDate(dueDate);
    const errors: FieldErrors = {};
    if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > 2100) errors.year = 'Informe um ano válido.';
    if (!totalValue || !Number.isFinite(numericTotal) || numericTotal <= 0) errors.totalValue = 'Informe o valor total do IPVA.';
    if (!Number.isInteger(numericInstallments) || numericInstallments < 1 || numericInstallments > 12) errors.installments = 'Informe de 1 a 12 parcelas.';
    if (!dueIso) errors.dueDate = 'Use uma data válida no formato DD/MM/AAAA.';

    const details = schedule.map((item) => ({
      ...item,
      due_date: item.number === 1
        ? item.due_date
        : parseExpenseDate(overrides[item.number]?.date ?? formatDateBR(item.due_date)) ?? '',
      status: overrides[item.number]?.status ?? item.status,
    }));
    if (!details.length || details.some((item, index) => !item.due_date || (index > 0 && item.due_date < details[index - 1].due_date))) {
      errors.schedule = 'Confira os valores e os vencimentos das parcelas em ordem cronológica.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !dueIso) return;

    const input: CreateIpvaInput = {
      year: numericYear,
      total_value: Math.round(numericTotal * 100) / 100,
      installments: numericInstallments,
      due_date: dueIso,
      status: details.every((item) => item.status === 'pago') ? 'pago' : 'pendente',
      notes: notes.trim() || undefined,
      installment_details: details,
    };

    saving.current = true;
    setLoading(true);
    try {
      if (ipvaId) await ipvaService.update(vehicleId, ipvaId, input);
      else await ipvaService.create(vehicleId, input);
      navigation.goBack();
    } catch (saveError) {
      if (saveError instanceof AxiosError && saveError.response?.status === 409) {
        setFieldErrors({ year: `Já existe IPVA de ${numericYear} cadastrado para este carro.` });
      } else {
        setError(getApiErrorMessage(saveError));
      }
    } finally {
      saving.current = false;
      setLoading(false);
    }
  }

  if (loadingRecord) {
    return <View style={styles.center}><ActivityIndicator accessibilityLabel="Carregando IPVA" color={colors.primary} size="large" /></View>;
  }

  if (editing && error && !year) {
    return <View style={styles.center}><FeedbackMessage message={error} /><PrimaryButton title="Tentar novamente" onPress={loadRecord} /></View>;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets keyboardDismissMode="interactive">
        <View style={styles.content}>
          <FeedbackMessage message={error} />
          <View style={styles.formCard}>
            <FormInput error={fieldErrors.year} icon="calendar-outline" keyboardType="number-pad" label="Ano"
              maxLength={4} onChangeText={setYear} placeholder="2026" value={year} />
            <FormInput error={fieldErrors.totalValue} icon="cash-outline" keyboardType="decimal-pad" label="Valor total"
              onChangeText={setTotalValue} placeholder="1500,00" value={totalValue} />
            <FormInput error={fieldErrors.installments} icon="layers-outline" keyboardType="number-pad" label="Parcelas"
              maxLength={2} onChangeText={(value) => { setInstallments(value); setOverrides({}); }} placeholder="1" value={installments} />
            <FormInput error={fieldErrors.dueDate} icon="alarm-outline" keyboardType="numbers-and-punctuation"
              label="Primeiro vencimento" maxLength={10} onChangeText={setDueDate} placeholder="31/01/2026" value={dueDate} />
            <View style={styles.field}>
              <Text style={styles.label}>Situação inicial</Text>
              <View style={styles.chipRow}>
                {(['pendente', 'pago'] as IpvaStatus[]).map((item) => (
                  <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: status === item }}
                    onPress={() => {
                      setStatus(item);
                      setOverrides((current) => Object.fromEntries(Object.entries(current).map(([key, value]) => [key, { date: value.date }])));
                    }} style={[styles.chip, status === item ? styles.chipActive : undefined]}>
                    <Text style={[styles.chipText, status === item ? styles.chipTextActive : undefined]}>{item === 'pago' ? 'Pago' : 'Pendente'}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <FeedbackMessage message={fieldErrors.schedule ?? ''} />
            {schedule.length ? <Text style={styles.hint}>Confira as datas no carnê. As sugestões mensais podem ser ajustadas.</Text> : null}
            {schedule.map((item) => {
              const itemStatus = overrides[item.number]?.status ?? status;
              return (
                <View key={item.number} style={styles.installment}>
                  <Text style={styles.label}>Parcela {item.number}: {formatCurrency(item.amount)}</Text>
                  {item.number > 1 ? (
                    <FormInput label={`Vencimento da parcela ${item.number}`} maxLength={10}
                      keyboardType="numbers-and-punctuation" value={overrides[item.number]?.date ?? formatDateBR(item.due_date)}
                      onChangeText={(value) => setOverrides((current) => ({ ...current, [item.number]: { ...current[item.number], date: value } }))} />
                  ) : null}
                  <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: itemStatus === 'pago' }}
                    onPress={() => setOverrides((current) => ({
                      ...current,
                      [item.number]: { ...current[item.number], status: itemStatus === 'pago' ? 'pendente' : 'pago' },
                    }))} style={styles.statusButton}>
                    <Text style={styles.label}>{itemStatus === 'pago' ? 'Pago ✓ — tocar para marcar pendente' : 'Pendente — tocar para marcar pago'}</Text>
                  </Pressable>
                </View>
              );
            })}
            <FormInput icon="create-outline" label="Observações (opcional)" multiline
              onChangeText={setNotes} placeholder="Ex: pago com desconto à vista" value={notes} />
            <PrimaryButton icon={editing ? 'save-outline' : 'add-circle-outline'}
              title={editing ? 'Salvar alterações' : 'Salvar IPVA'} onPress={handleSave} loading={loading} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20, backgroundColor: colors.background },
  container: { flexGrow: 1, alignItems: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 520, gap: 18 },
  formCard: { gap: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 17, backgroundColor: colors.surface },
  hint: { marginTop: -6, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  field: { gap: 7 },
  installment: { gap: 9, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  label: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 42, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radii.round, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.surface },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.surface },
  statusButton: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, paddingHorizontal: 12, backgroundColor: colors.surfaceMuted },
});
