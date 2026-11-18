import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { IpvaRecord } from '../types/ipva';
import { daysUntil, dueLabel } from '../utils/dueDate';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { colors, radii } from '../utils/theme';

type Props = {
  record: IpvaRecord;
  updating?: boolean;
  onToggleStatus(): void;
  onDelete(): void;
};

export function IpvaCard({ record, updating = false, onToggleStatus, onDelete }: Props) {
  const paid = record.status === 'pago';
  const days = daysUntil(record.due_date);
  const overdue = !paid && days < 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.year}>IPVA {record.year}</Text>
        <View style={[styles.badge, paid ? styles.badgePaid : overdue ? styles.badgeOverdue : styles.badgePending]}>
          <Text style={[styles.badgeText, paid ? styles.badgeTextPaid : overdue ? styles.badgeTextOverdue : undefined]}>
            {paid ? 'Pago' : overdue ? 'Vencido' : 'Pendente'}
          </Text>
        </View>
      </View>
      <Text style={styles.total}>{formatCurrency(record.total_value)}</Text>
      <Text style={styles.meta}>
        {record.installments === 1
          ? 'Parcela única'
          : `${record.installments}x de ${formatCurrency(record.installment_value)}`}
      </Text>
      <Text style={styles.meta}>
        Vencimento: {formatDateBR(record.due_date)}{paid ? '' : ` · ${dueLabel(days)}`}
      </Text>
      {record.notes ? <Text style={styles.notes}>{record.notes}</Text> : null}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" disabled={updating} onPress={onToggleStatus} style={styles.action}>
          {updating
            ? <ActivityIndicator color={colors.text} size="small" />
            : <Text style={styles.actionText}>{paid ? 'Marcar como pendente' : 'Marcar como pago'}</Text>}
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDelete} style={[styles.action, styles.deleteAction]}>
          <Text style={[styles.actionText, styles.deleteText]}>Excluir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: 16,
    backgroundColor: colors.surface,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  year: { color: colors.text, fontSize: 16, fontWeight: '800' },
  badge: { borderRadius: radii.round, paddingHorizontal: 10, paddingVertical: 4 },
  badgePending: { backgroundColor: colors.surfaceMuted },
  badgePaid: { backgroundColor: colors.successSoft },
  badgeOverdue: { backgroundColor: colors.dangerSoft },
  badgeText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  badgeTextPaid: { color: colors.success },
  badgeTextOverdue: { color: colors.danger },
  total: { marginTop: 4, color: colors.text, fontSize: 20, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: 13 },
  notes: { marginTop: 4, color: colors.text, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  action: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
  },
  actionText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  deleteAction: { flex: 0, minWidth: 96, paddingHorizontal: 16, borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  deleteText: { color: colors.danger },
});
