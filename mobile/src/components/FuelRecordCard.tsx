import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FuelRecord } from '../types/fuelRecord';
import { formatCurrency, formatDateBR, formatLiters, formatMileage } from '../utils/formatters';
import { fuelTypeLabels } from '../utils/fuelCalculations';
import { colors, radii } from '../utils/theme';

type Props = {
  record: FuelRecord;
  onPress(): void;
};

export function FuelRecordCard({ record, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : undefined]}
    >
      <View style={styles.icon}>
        <Ionicons color={colors.text} name="water-outline" size={26} />
      </View>
      <View style={styles.content}>
        <Text style={styles.date}>{formatDateBR(record.date)}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{formatLiters(record.liters)} · {formatMileage(record.mileage)}</Text>
          <Text style={styles.tag}>{fuelTypeLabels[record.fuel_type]}{record.full_tank ? ' · cheio' : ''}</Text>
        </View>
      </View>
      <Text style={styles.price}>{formatCurrency(record.total_price)}</Text>
    </Pressable>
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
  content: { flex: 1, gap: 3 },
  date: { color: colors.text, fontSize: 15, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  meta: { color: colors.textMuted, fontSize: 12 },
  tag: { color: colors.textSubtle, fontSize: 11, fontWeight: '600' },
  price: { color: colors.text, fontSize: 14, fontWeight: '800' },
});
