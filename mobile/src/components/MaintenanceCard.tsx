import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { MaintenanceRecord } from '../types/maintenanceRecord';
import { formatCurrency, formatDateBR, formatMileage } from '../utils/formatters';
import { maintenanceTypeLabels } from '../utils/maintenanceCalculations';
import { colors, radii } from '../utils/theme';

type Props = {
  record: MaintenanceRecord;
};

export function MaintenanceCard({ record }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons color={colors.text} name="construct-outline" size={26} />
      </View>
      <View style={styles.content}>
        <Text style={styles.type}>{maintenanceTypeLabels[record.type]}</Text>
        <Text style={styles.meta}>{formatDateBR(record.date)} · {formatMileage(record.mileage)}</Text>
        <Text numberOfLines={1} style={styles.description}>{record.description}</Text>
      </View>
      <Text style={styles.cost}>{record.cost ? formatCurrency(record.cost) : '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: 14,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  icon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.medium,
    backgroundColor: colors.surfaceMuted,
  },
  content: { flex: 1, gap: 2 },
  type: { color: colors.text, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12 },
  description: { marginTop: 2, color: colors.textMuted, fontSize: 12 },
  cost: { color: colors.text, fontSize: 14, fontWeight: '800' },
});
