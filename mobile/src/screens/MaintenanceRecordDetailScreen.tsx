import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { PrimaryButton } from '../components/PrimaryButton';
import { RecordActions } from '../components/RecordActions';
import { getApiErrorMessage } from '../services/api';
import { maintenanceService } from '../services/maintenanceService';
import type { AppStackParamList } from '../types/navigation';
import type { MaintenanceRecord } from '../types/maintenanceRecord';
import { maintenanceTypeLabels, oilTypeLabels } from '../utils/maintenanceCalculations';
import { formatOptionalCurrency, formatDateBR, formatMileage } from '../utils/formatters';
import { colors, radii } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'MaintenanceRecordDetail'>;

type Row = { label: string; value: string };

export function MaintenanceRecordDetailScreen({ route, navigation }: Props) {
  const { vehicleId, recordId } = route.params;
  const [record, setRecord] = useState<MaintenanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecord = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRecord(await maintenanceService.detail(vehicleId, recordId));
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
        <FeedbackMessage message={error || 'Manutenção não encontrada.'} />
        <PrimaryButton title="Tentar novamente" onPress={loadRecord} />
      </View>
    );
  }

  const rows: Row[] = [
    { label: 'Tipo', value: maintenanceTypeLabels[record.type] },
    { label: 'Data', value: formatDateBR(record.date) },
    { label: 'Quilometragem', value: formatMileage(record.mileage) },
    { label: 'Valor', value: formatOptionalCurrency(record.cost) },
  ];
  if (record.oil_type) rows.push({ label: 'Tipo de óleo', value: oilTypeLabels[record.oil_type] });
  if (record.brand) rows.push({ label: 'Marca', value: record.brand });
  if (record.warranty_months != null) rows.push({ label: 'Garantia', value: `${record.warranty_months} meses` });
  if (record.next_service_mileage != null) {
    rows.push({ label: 'Próxima manutenção', value: formatMileage(record.next_service_mileage) });
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <View style={styles.card}>
            {rows.map((row, index) => (
              <View key={row.label} style={[styles.row, index === rows.length - 1 ? styles.lastRow : undefined]}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Descrição</Text>
            <Text style={styles.notesText}>{record.description}</Text>
          </View>

          {record.service_notes ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>Itens revisados</Text>
              <Text style={styles.notesText}>{record.service_notes}</Text>
            </View>
          ) : null}
          <RecordActions label="manutenção"
            onEdit={() => navigation.navigate('AddMaintenanceRecord', { vehicleId, recordId })}
            onDelete={() => maintenanceService.remove(vehicleId, recordId)}
            onDeleted={() => navigation.popTo('MaintenanceRecords', { vehicleId })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, alignItems: 'center', padding: 20, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 520, gap: 16 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  row: {
    minHeight: 48,
    gap: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: { flex: 1, minWidth: 0, color: colors.textMuted, fontSize: 13 },
  rowValue: { flex: 1, minWidth: 0, textAlign: 'right', color: colors.text, fontSize: 14, fontWeight: '700' },
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
