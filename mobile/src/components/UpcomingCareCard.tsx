import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../services/api';
import { careService } from '../services/careService';
import type { CareItem, CareSummary } from '../types/care';
import { formatMileage } from '../utils/formatters';
import { maintenanceTypeLabels } from '../utils/maintenanceCalculations';
import { colors, radii } from '../utils/theme';
import { FeedbackMessage } from './FeedbackMessage';
import { PrimaryButton } from './PrimaryButton';

type Props = { vehicleId: string; onRecord: (recordId: string) => void; onAdd: () => void };
const statusColors = { unscheduled: colors.textSubtle, overdue: colors.danger, soon: colors.warning, upcoming: colors.success };

function statusText(item: CareItem) {
  if (item.remaining_km == null) return 'A programar';
  if (item.remaining_km === 0) return 'Vence agora';
  if (item.remaining_km < 0) return `Vencido há ${formatMileage(-item.remaining_km)}`;
  return `Faltam ${formatMileage(item.remaining_km)}`;
}

export function UpcomingCareCard({ vehicleId, onRecord, onAdd }: Props) {
  const [care, setCare] = useState<CareSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setCare(null); setLoading(true); setError('');
    careService.summary(vehicleId).then((result) => { if (active) setCare(result); })
      .catch((loadError) => { if (active) setError(getApiErrorMessage(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [vehicleId, revision]));

  return <View style={styles.section}>
    <Text accessibilityRole="header" style={styles.title}>Próximos cuidados</Text>
    {loading ? <ActivityIndicator accessibilityLabel="Carregando próximos cuidados" color={colors.primary} /> : null}
    <FeedbackMessage message={error} />
    {error ? <PrimaryButton title="Tentar novamente" onPress={() => setRevision((value) => value + 1)} /> : null}
    {care ? <>
      <Text style={styles.hint}>Base: maior quilometragem informada, {formatMileage(care.current_mileage)}. Alerta a partir de {formatMileage(care.warning_threshold_km)} restantes.</Text>
      <View style={styles.card}>
        {care.items.map((item) => <Pressable key={item.type} accessibilityRole="button"
          accessibilityLabel={`${maintenanceTypeLabels[item.type]}: ${statusText(item)}. ${item.record_id ? 'Ver manutenção' : 'Registrar manutenção'}`}
          onPress={() => item.record_id ? onRecord(item.record_id) : onAdd()} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: statusColors[item.status] }]} />
          <View style={styles.content}>
            <Text style={styles.name}>{maintenanceTypeLabels[item.type]}</Text>
            <Text style={styles.hint}>{item.next_service_mileage == null ? 'Informe a próxima troca ao registrar uma manutenção.' : `Próxima: ${formatMileage(item.next_service_mileage)}`}</Text>
            <Text style={[styles.status, { color: statusColors[item.status] }]}>{statusText(item)}</Text>
          </View>
        </Pressable>)}
      </View>
    </> : null}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, paddingHorizontal: 14, backgroundColor: colors.surface },
  row: { minHeight: 70, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  content: { flex: 1, minWidth: 0, gap: 4 },
  name: { color: colors.text, fontSize: 14, fontWeight: '700' },
  status: { fontSize: 13, fontWeight: '700' },
});
