import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { getApiErrorMessage } from '../services/api';
import { fuelService } from '../services/fuelService';
import type { AppStackParamList } from '../types/navigation';
import type { FuelRecord } from '../types/fuelRecord';
import {
  calculateConsumption,
  fuelTypeLabels,
  pricePerLiter,
} from '../utils/fuelCalculations';
import { formatCurrency, formatDateBR, formatLiters, formatMileage } from '../utils/formatters';
import { colors, radii } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'FuelRecordDetail'>;

type Row = { label: string; value: string };

export function FuelRecordDetailScreen({ route }: Props) {
  const { vehicleId, recordId } = route.params;
  const [record, setRecord] = useState<FuelRecord | null>(null);
  const [consumption, setConsumption] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecord = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const records = await fuelService.list(vehicleId);
      const found = records.find((item) => item.id === recordId) ?? null;
      setRecord(found);
      setConsumption(found ? calculateConsumption(records, recordId) : null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [vehicleId, recordId]);

  useFocusEffect(useCallback(() => {
    loadRecord();
  }, [loadRecord]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={styles.center}>
        <FeedbackMessage message={error || 'Abastecimento não encontrado.'} />
      </View>
    );
  }

  const rows: Row[] = [
    { label: 'Data', value: formatDateBR(record.date) },
    { label: 'Quilometragem', value: formatMileage(record.mileage) },
    { label: 'Litros', value: formatLiters(record.liters) },
    { label: 'Valor total', value: formatCurrency(record.total_price) },
    { label: 'Valor por litro', value: formatCurrency(pricePerLiter(record)) },
    { label: 'Combustível', value: fuelTypeLabels[record.fuel_type] },
    { label: 'Tanque cheio', value: record.full_tank ? 'Sim' : 'Não' },
  ];
  if (record.gas_station) rows.push({ label: 'Posto', value: record.gas_station });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.consumptionCard}>
          <Ionicons color={colors.text} name="speedometer-outline" size={26} />
          <View style={styles.consumptionText}>
            <Text style={styles.consumptionLabel}>Consumo médio desde o último tanque cheio</Text>
            <Text style={styles.consumptionValue}>
              {consumption ? `${consumption.toFixed(1)} km/l` : 'Não disponível ainda'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          {rows.map((row, index) => (
            <View key={row.label} style={[styles.row, index === rows.length - 1 ? styles.lastRow : undefined]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {record.notes ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Observações</Text>
            <Text style={styles.notesText}>{record.notes}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', padding: 20, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 520, gap: 16 },
  consumptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.large,
    padding: 16,
    backgroundColor: colors.surface,
  },
  consumptionText: { flex: 1, gap: 3 },
  consumptionLabel: { color: colors.textMuted, fontSize: 12 },
  consumptionValue: { color: colors.text, fontSize: 19, fontWeight: '800' },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: { color: colors.textMuted, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  notesCard: {
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: 14,
    backgroundColor: colors.surface,
  },
  notesLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  notesText: { color: colors.text, fontSize: 14, lineHeight: 20 },
});
