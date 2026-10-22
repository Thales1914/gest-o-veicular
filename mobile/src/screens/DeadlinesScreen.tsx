import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { PrimaryButton } from '../components/PrimaryButton';
import { getApiErrorMessage } from '../services/api';
import { deadlineService } from '../services/deadlineService';
import type { DeadlineItem, DeadlineSummary } from '../types/deadline';
import type { AppStackParamList } from '../types/navigation';
import { dueLabel } from '../utils/dueDate';
import { formatDateBR } from '../utils/formatters';
import { colors, radii } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Deadlines'>;

const periods = [30, 60, 90];

export function DeadlinesScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<DeadlineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      setSummary(await deadlineService.summary(vehicleId, days));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vehicleId, days]);

  useFocusEffect(useCallback(() => {
    loadSummary();
  }, [loadSummary]));

  // Documento abre o detalhe; IPVA abre a lista de IPVA, onde dá para marcar como pago.
  function openItem(item: DeadlineItem) {
    if (item.kind === 'document') navigation.navigate('DocumentDetail', { vehicleId, documentId: item.id });
    else navigation.navigate('Ipva', { vehicleId });
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSummary(true)} tintColor={colors.text} />}
      >
        <View style={styles.content}>
          <Text style={styles.subtitle}>Documentos e IPVA que já venceram ou vencem nos próximos dias.</Text>
          <View style={styles.chipRow}>
            {periods.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: days === item }}
                onPress={() => setDays(item)}
                style={[styles.chip, days === item ? styles.chipActive : undefined]}
              >
                <Text style={[styles.chipText, days === item ? styles.chipTextActive : undefined]}>{item} dias</Text>
              </Pressable>
            ))}
          </View>

          {loading && !summary ? <ActivityIndicator color={colors.primary} size="large" /> : null}
          <FeedbackMessage message={error} />
          {error ? <PrimaryButton title="Tentar novamente" onPress={() => loadSummary()} /> : null}

          {summary ? (
            <>
              <View style={styles.counters}>
                <View style={[styles.counter, styles.counterDanger]}>
                  <Text style={[styles.counterValue, styles.dangerText]}>{summary.overdue_count}</Text>
                  <Text style={styles.counterLabel}>Vencidos</Text>
                </View>
                <View style={[styles.counter, styles.counterWarning]}>
                  <Text style={styles.counterValue}>{summary.upcoming_count}</Text>
                  <Text style={styles.counterLabel}>Vencem em até {summary.days} dias</Text>
                </View>
              </View>

              {summary.items.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons color={colors.success} name="checkmark-circle-outline" size={40} />
                  <Text style={styles.emptyTitle}>Tudo em dia</Text>
                  <Text style={styles.emptyText}>Nenhum documento ou IPVA vence nesse período.</Text>
                </View>
              ) : summary.items.map((item) => (
                <Pressable
                  key={`${item.kind}-${item.id}`}
                  accessibilityRole="button"
                  onPress={() => openItem(item)}
                  style={({ pressed }) => [styles.item, pressed ? styles.pressed : undefined]}
                >
                  <View style={[styles.dot, { backgroundColor: item.status === 'vencido' ? colors.danger : colors.warning }]} />
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>{formatDateBR(item.due_date)} · {dueLabel(item.days_left)}</Text>
                  </View>
                  <Ionicons
                    color={colors.textSubtle}
                    name={item.kind === 'ipva' ? 'receipt-outline' : 'document-text-outline'}
                    size={20}
                  />
                </Pressable>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, alignItems: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 520, gap: 14 },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
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
  counters: { flexDirection: 'row', gap: 10 },
  counter: { flex: 1, gap: 2, borderRadius: radii.medium, padding: 14 },
  counterDanger: { backgroundColor: colors.dangerSoft },
  counterWarning: { backgroundColor: colors.surfaceMuted },
  counterValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  dangerText: { color: colors.danger },
  counterLabel: { color: colors.textMuted, fontSize: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: 14,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  dot: { width: 10, height: 10, borderRadius: 5 },
  itemContent: { flex: 1, minWidth: 0, gap: 2 },
  itemTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  itemMeta: { color: colors.textMuted, fontSize: 12 },
  empty: { alignItems: 'center', gap: 6, padding: 24 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
});
