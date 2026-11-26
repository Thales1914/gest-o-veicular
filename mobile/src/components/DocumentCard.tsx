import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { documentTypeLabels, type VehicleDocument } from '../types/document';
import { daysUntil, dueLabel, dueStatus } from '../utils/dueDate';
import { formatDateBR } from '../utils/formatters';
import { colors, radii } from '../utils/theme';

type Props = {
  document: VehicleDocument;
  onPress(): void;
};

const statusColors = { vencido: colors.danger, proximo: colors.warning, em_dia: colors.success };

export function DocumentCard({ document, onPress }: Props) {
  const days = document.expiry_date ? daysUntil(document.expiry_date) : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : undefined]}
    >
      <View style={styles.icon}>
        <Ionicons color={colors.text} name="document-text-outline" size={26} />
      </View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>{document.title}</Text>
        <Text style={styles.meta}>
          {documentTypeLabels[document.type]}
          {document.expiry_date ? ` · vence ${formatDateBR(document.expiry_date)}` : ' · sem vencimento'}
        </Text>
        {days != null ? (
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: statusColors[dueStatus(days)] }]} />
            <Text style={styles.status}>{dueLabel(days)}</Text>
          </View>
        ) : null}
      </View>
      <Ionicons color={colors.textSubtle} name="chevron-forward" size={20} />
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
  content: { flex: 1, minWidth: 0, gap: 2 },
  title: { color: colors.text, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  status: { color: colors.text, fontSize: 12, fontWeight: '600' },
});
