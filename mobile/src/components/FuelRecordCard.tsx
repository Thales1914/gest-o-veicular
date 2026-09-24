import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { FuelRecord } from '../types/fuelRecord';
import { formatCurrency, formatDateBR, formatLiters, formatMileage } from '../utils/formatters';
import { colors, radii } from '../utils/theme';

type Props = {
  record: FuelRecord;
};

export function FuelRecordCard({ record }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons color={colors.text} name="water-outline" size={26} />
      </View>
      <View style={styles.content}>
        <Text style={styles.date}>{formatDateBR(record.date)}</Text>
        <Text style={styles.meta}>{formatLiters(record.liters)} · {formatMileage(record.mileage)}</Text>
      </View>
      <Text style={styles.price}>{formatCurrency(record.total_price)}</Text>
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
  meta: { color: colors.textMuted, fontSize: 12 },
  price: { color: colors.text, fontSize: 14, fontWeight: '800' },
});
