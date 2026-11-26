import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii } from '../utils/theme';

type Props = {
  title: string;
  onPress(): void;
  loading?: boolean;
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
};

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
}: Props) {
  const unavailable = loading || disabled;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !unavailable ? styles.pressed : undefined,
        unavailable ? styles.disabled : undefined,
      ]}
    >
      {loading
        ? <ActivityIndicator color={colors.surface} />
        : (
          <>
            {icon ? <Ionicons color={colors.surface} name={icon} size={19} /> : null}
            <Text style={styles.text}>{title}</Text>
          </>
        )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.medium,
    paddingHorizontal: 18,
    backgroundColor: colors.primary,
  },
  pressed: { backgroundColor: colors.primaryPressed },
  disabled: { backgroundColor: colors.disabled },
  text: { color: colors.surface, fontSize: 16, fontWeight: '700' },
});
