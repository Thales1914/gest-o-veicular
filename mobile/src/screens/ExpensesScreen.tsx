import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { getApiErrorMessage } from '../services/api';
import { expenseService } from '../services/expenseService';
import type { ExpensePeriod, ExpenseSummary } from '../types/expense';
import type { AppStackParamList } from '../types/navigation';
import { monthPeriod, parseExpenseDate } from '../utils/expensePeriod';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { colors, radii } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Expenses'>;

export function ExpensesScreen({ route }: Props) {
  const { vehicleId } = route.params;
  const [period, setPeriod] = useState<ExpensePeriod>(() => monthPeriod());
  const [startDate, setStartDate] = useState(() => formatDateBR(period.start_date));
  const [endDate, setEndDate] = useState(() => formatDateBR(period.end_date));
  const [fieldErrors, setFieldErrors] = useState<{ start?: string; end?: string }>({});
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revision, setRevision] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    setSummary(null);
    expenseService.summary(vehicleId, period)
      .then((result) => { if (active) setSummary(result); })
      .catch((loadError) => { if (active) setError(getApiErrorMessage(loadError)); })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => { active = false; };
  }, [vehicleId, period, revision]));

  function applyPeriod() {
    const start = parseExpenseDate(startDate);
    const end = parseExpenseDate(endDate);
    const errors: typeof fieldErrors = {};
    if (!start) errors.start = 'Informe uma data válida em DD/MM/AAAA (a partir de 1900).';
    if (!end) errors.end = 'Informe uma data válida em DD/MM/AAAA (a partir de 1900).';
    if (start && end && start > end) errors.end = 'A data final deve ser igual ou posterior à inicial.';
    setFieldErrors(errors);
    if (start && end && Object.keys(errors).length === 0) {
      setPeriod({ start_date: start, end_date: end });
    }
  }

  function selectMonth(previous: boolean) {
    const selected = monthPeriod(previous);
    setStartDate(formatDateBR(selected.start_date));
    setEndDate(formatDateBR(selected.end_date));
    setFieldErrors({});
    setPeriod(selected);
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          setRevision((value) => value + 1);
        }} tintColor={colors.primary} />}
      >
        <View style={styles.shell}>
          <View style={styles.intro}>
            <View style={styles.iconBox}><Ionicons name="wallet-outline" size={30} color={colors.text} /></View>
            <View style={styles.introText}>
              <Text style={styles.title}>Controle de gastos</Text>
              <Text style={styles.subtitle}>Abastecimentos e manutenções do seu veículo em um só lugar.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Escolha o período</Text>
            <View style={styles.shortcuts}>
              <Pressable accessibilityRole="button" onPress={() => selectMonth(false)} style={styles.chip}>
                <Text style={styles.chipText}>Este mês</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => selectMonth(true)} style={styles.chip}>
                <Text style={styles.chipText}>Mês anterior</Text>
              </Pressable>
            </View>
            <FormInput icon="calendar-outline" label="Data inicial" placeholder="01/10/2026" maxLength={10}
              value={startDate} onChangeText={setStartDate} error={fieldErrors.start} />
            <FormInput icon="calendar-outline" label="Data final" placeholder="31/10/2026" maxLength={10}
              value={endDate} onChangeText={setEndDate} error={fieldErrors.end} onSubmitEditing={applyPeriod} />
            <PrimaryButton title="Filtrar gastos" icon="filter-outline" onPress={applyPeriod} loading={loading} />
          </View>

          <FeedbackMessage message={error} />
          {error ? <PrimaryButton title="Tentar novamente" onPress={() => setRevision((value) => value + 1)} /> : null}
          {loading ? <ActivityIndicator accessibilityLabel="Carregando gastos" color={colors.primary} size="large" /> : null}

          {!loading && summary ? (
            <>
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total do período</Text>
                <Text style={styles.total}>{formatCurrency(summary.total)}</Text>
                <Text style={styles.totalPeriod}>{formatDateBR(period.start_date)} a {formatDateBR(period.end_date)}</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.categoryHeader}>
                  <Ionicons name="water-outline" size={24} color={colors.text} />
                  <Text style={styles.sectionTitle}>Abastecimentos</Text>
                </View>
                <Text style={styles.categoryValue}>{formatCurrency(summary.fuel_total)}</Text>
                <Text style={styles.subtitle}>{summary.fuel_count} registro(s) no período</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.categoryHeader}>
                  <Ionicons name="construct-outline" size={24} color={colors.text} />
                  <Text style={styles.sectionTitle}>Manutenções</Text>
                </View>
                <Text style={styles.categoryValue}>{formatCurrency(summary.maintenance_total)}</Text>
                <Text style={styles.subtitle}>{summary.maintenance_count} registro(s) no período</Text>
                {summary.maintenance_without_cost > 0 ? (
                  <Text style={styles.notice}>{summary.maintenance_without_cost} manutenção(ões) sem valor informado. O total considera somente os valores registrados.</Text>
                ) : null}
              </View>
              {summary.fuel_count + summary.maintenance_count === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
                  <Text style={styles.sectionTitle}>Nenhum registro neste período</Text>
                  <Text style={styles.emptyText}>Escolha outras datas ou registre um abastecimento ou uma manutenção.</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, alignItems: 'center', padding: 18, paddingBottom: 32 },
  shell: { width: '100%', maxWidth: 620, gap: 16 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  introText: { flex: 1, gap: 4 },
  iconBox: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.large, padding: 17, gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: radii.round, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, paddingHorizontal: 15, paddingVertical: 10 },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  totalCard: { borderRadius: radii.large, backgroundColor: colors.primary, padding: 22, gap: 8 },
  totalLabel: { color: colors.surfaceMuted, fontSize: 14, fontWeight: '600' },
  total: { color: colors.surface, fontSize: 32, fontWeight: '800' },
  totalPeriod: { color: colors.surfaceMuted, fontSize: 12 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  notice: { color: colors.textMuted, fontSize: 12, lineHeight: 18, backgroundColor: colors.surfaceMuted, padding: 12, borderRadius: radii.small },
  empty: { alignItems: 'center', padding: 22, gap: 10 },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
