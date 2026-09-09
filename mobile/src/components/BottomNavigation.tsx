import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../utils/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  onHome(): void;
  onAdd(): void;
};

type ItemProps = {
  icon: IconName;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress?(): void;
};

function NavigationItem({ icon, label, active = false, disabled = false, onPress }: ItemProps) {
  const color = active ? colors.text : disabled ? colors.disabled : colors.textMuted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={styles.item}
    >
      <Ionicons color={color} name={icon} size={21} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function BottomNavigation({ onHome, onAdd }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <NavigationItem active icon="home-outline" label="Início" onPress={onHome} />
      <NavigationItem disabled icon="construct-outline" label="Manutenção" />
      <Pressable
        accessibilityLabel="Adicionar veículo"
        accessibilityRole="button"
        onPress={onAdd}
        style={({ pressed }) => [styles.addButton, pressed ? styles.addPressed : undefined]}
      >
        <Ionicons color={colors.surface} name="add" size={28} />
      </Pressable>
      <NavigationItem disabled icon="water-outline" label="Abastecer" />
      <NavigationItem disabled icon="menu-outline" label="Mais" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingHorizontal: 6,
    backgroundColor: colors.surface,
  },
  item: { width: 68, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 9, fontWeight: '600' },
  addButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: -22,
    borderWidth: 4,
    borderColor: colors.background,
    borderRadius: 26,
    backgroundColor: colors.primary,
  },
  addPressed: { backgroundColor: colors.primaryPressed },
});
