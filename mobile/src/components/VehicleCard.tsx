import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Vehicle } from '../types/vehicle';
import { formatMileage } from '../utils/formatters';
import { colors, radii } from '../utils/theme';

type Props = {
  vehicle: Vehicle;
  onPress(): void;
};

export function VehicleCard({ vehicle, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : undefined]}
    >
      <View style={styles.carIcon}>
        <Ionicons color={colors.text} name="car-sport-outline" size={34} />
      </View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>{vehicle.brand} {vehicle.model}</Text>
        <Text style={styles.year}>{vehicle.year}</Text>
        <Text style={styles.mileage}>{formatMileage(vehicle.current_mileage)}</Text>
      </View>
      <View style={styles.trailing}>
        <Text style={styles.plate}>{vehicle.plate}</Text>
        <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
      </View>
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
  carIcon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.medium,
    backgroundColor: colors.surfaceMuted,
  },
  content: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  year: { color: colors.textMuted, fontSize: 13 },
  mileage: { marginTop: 3, color: colors.text, fontSize: 13, fontWeight: '600' },
  trailing: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' },
  plate: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.7 },
});
