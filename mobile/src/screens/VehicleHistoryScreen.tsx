import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { getApiErrorMessage } from '../services/api';
import { historyService } from '../services/historyService';
import type { AppStackParamList } from '../types/navigation';
import type { HistoryCategory, HistoryEntry, HistoryQuery } from '../types/history';
import { parseExpenseDate } from '../utils/expensePeriod';
import { formatDateBR, formatMileage, formatOptionalCurrency } from '../utils/formatters';
import { colors, radii } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'VehicleHistory'>;
const categories: { value: HistoryCategory; label: string }[] = [
  { value: 'all', label: 'Todos' }, { value: 'fuel', label: 'Abastecimentos' }, { value: 'maintenance', label: 'Manutenções' },
];

export function VehicleHistoryScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const [query, setQuery] = useState<HistoryQuery>({ category: 'all' });
  const [category, setCategory] = useState<HistoryCategory>('all');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [filterError, setFilterError] = useState('');
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const busy = useRef(false);

  useFocusEffect(useCallback(() => {
    const current = ++generation.current;
    busy.current = true;
    setLoading(true); setError(''); setEntries([]); setTotal(0); setHasMore(false);
    historyService.list(vehicleId, query).then((result) => {
      if (current !== generation.current) return;
      setEntries(result.entries); setTotal(result.total); setHasMore(result.has_more);
    }).catch((loadError) => { if (current === generation.current) setError(getApiErrorMessage(loadError)); })
      .finally(() => { if (current === generation.current) { busy.current = false; setLoading(false); } });
    return () => { generation.current++; };
  }, [vehicleId, query, revision]));

  async function loadMore() {
    if (busy.current || !hasMore) return;
    const current = generation.current;
    busy.current = true; setLoading(true); setError('');
    try {
      const result = await historyService.list(vehicleId, query, entries.length);
      if (current !== generation.current) return;
      setEntries((previous) => {
        const seen = new Set(previous.map((entry) => `${entry.category}:${entry.id}`));
        return [...previous, ...result.entries.filter((entry) => !seen.has(`${entry.category}:${entry.id}`))];
      });
      setTotal(result.total); setHasMore(result.has_more);
    } catch (loadError) { if (current === generation.current) setError(getApiErrorMessage(loadError)); }
    finally { if (current === generation.current) { busy.current = false; setLoading(false); } }
  }

  function filter() {
    const startDate = start.trim() ? parseExpenseDate(start) : undefined;
    const endDate = end.trim() ? parseExpenseDate(end) : undefined;
    if (startDate === null || endDate === null) { setFilterError('Use datas válidas em DD/MM/AAAA, a partir de 1900.'); return; }
    if (startDate && endDate && startDate > endDate) { setFilterError('A data final deve ser igual ou posterior à inicial.'); return; }
    setFilterError(''); setQuery({ category, start_date: startDate, end_date: endDate });
  }

  return <SafeAreaView edges={['bottom']} style={styles.screen}>
    <FlatList data={entries} keyExtractor={(entry) => `${entry.category}:${entry.id}`}
      contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets keyboardDismissMode="interactive"
      refreshing={loading && entries.length === 0} onRefresh={() => setRevision((value) => value + 1)}
      ListHeaderComponent={<View style={styles.header}>
        <Text style={styles.title}>Histórico do veículo</Text>
        <Text style={styles.hint}>Abastecimentos e manutenções, do mais recente ao mais antigo.</Text>
        <View style={styles.filters}>
          {categories.map((item) => <Pressable key={item.value} accessibilityRole="button"
            accessibilityState={{ selected: category === item.value }} onPress={() => setCategory(item.value)}
            style={[styles.chip, category === item.value && styles.selected]}>
            <Text style={styles.text}>{item.label}</Text>
          </Pressable>)}
        </View>
        <FormInput label="Data inicial (opcional)" value={start} onChangeText={setStart} placeholder="DD/MM/AAAA" maxLength={10} />
        <FormInput label="Data final (opcional)" value={end} onChangeText={setEnd} placeholder="DD/MM/AAAA" maxLength={10} />
        <FeedbackMessage message={filterError} />
        <PrimaryButton title="Filtrar histórico" onPress={filter} loading={loading} />
        <Text style={styles.hint}>{total} registro(s) encontrado(s)</Text>
        <FeedbackMessage message={error} />
        {error ? <PrimaryButton title="Tentar novamente" onPress={entries.length ? loadMore : () => setRevision((value) => value + 1)} /> : null}
      </View>}
      ListEmptyComponent={!loading && !error ? <Text style={styles.hint}>Nenhum registro encontrado para os filtros selecionados.</Text> : null}
      ListFooterComponent={<View style={styles.footer}>
        {loading ? <ActivityIndicator accessibilityLabel="Carregando histórico" color={colors.primary} /> : null}
        {hasMore && !loading ? <PrimaryButton title="Carregar mais" onPress={loadMore} /> : null}
      </View>}
      renderItem={({ item }) => <Pressable accessibilityRole="button"
        accessibilityLabel={`Ver ${item.category === 'fuel' ? 'abastecimento' : 'manutenção'} de ${formatDateBR(item.date)}`}
        onPress={() => navigation.navigate(item.category === 'fuel' ? 'FuelRecordDetail' : 'MaintenanceRecordDetail', { vehicleId, recordId: item.id })}
        style={styles.card}>
        <Text style={styles.hint}>{item.category === 'fuel' ? 'Abastecimento' : 'Manutenção'} • {formatDateBR(item.date)}</Text>
        <Text style={styles.text}>{item.description}</Text>
        <Text style={styles.hint}>{formatMileage(item.mileage)}</Text>
        <Text style={styles.amount}>{formatOptionalCurrency(item.amount)}</Text>
      </Pressable>} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 20, width: '100%', maxWidth: 560, alignSelf: 'center', gap: 12 },
  header: { gap: 12, marginBottom: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  text: { color: colors.text, fontSize: 14, fontWeight: '600' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, justifyContent: 'center', padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radii.round },
  selected: { borderColor: colors.primary, backgroundColor: colors.surfaceMuted },
  card: { padding: 16, gap: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium },
  amount: { color: colors.text, fontSize: 17, fontWeight: '800' },
  footer: { gap: 12, paddingVertical: 12 },
});
