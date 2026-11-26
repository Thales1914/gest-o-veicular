import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../utils/theme';

type Props = {
  message?: string;
  type?: 'error' | 'success';
};

export function FeedbackMessage({ message, type = 'error' }: Props) {
  if (!message) return null;

  return (
    <View accessibilityRole="alert" style={[styles.container, styles[`${type}Container`]]}>
      <Ionicons
        color={type === 'success' ? colors.success : colors.danger}
        name={type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
        size={18}
      />
      <Text style={[styles.message, styles[type]]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: radii.small,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorContainer: { backgroundColor: colors.dangerSoft },
  successContainer: { backgroundColor: colors.successSoft },
  message: { flex: 1, fontSize: 13, lineHeight: 18 },
  error: { color: colors.danger },
  success: { color: colors.success },
});
