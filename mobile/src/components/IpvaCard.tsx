import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { IpvaRecord } from '../types/ipva';
import { daysUntil } from '../utils/dueDate';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { colors, radii } from '../utils/theme';

type Props = {
  record: IpvaRecord;
  updating?: boolean;
  onEdit(): void;
  onToggleStatus(): void;
  onToggleInstallment(number: number): void;
  onDelete(): void;
};

export function IpvaCard({ record, updating = false, onEdit, onToggleStatus, onToggleInstallment, onDelete }: Props) {
  const paid = record.status === 'pago';
  const days = daysUntil(record.next_due_date ?? record.due_date);
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
        {record.installments === 1 ? 'Parcela única' : `${record.paid_installments} de ${record.installments} parcelas pagas`}
      </Text>
      <Text style={styles.meta}>
        {paid ? 'Primeiro vencimento' : 'Próximo vencimento'}: {formatDateBR(record.next_due_date ?? record.due_date)}
      </Text>
      {record.installment_details.map((item) => (
        <Pressable key={item.number} accessibilityRole="checkbox" accessibilityState={{ checked: item.status === 'pago' }}
          disabled={updating} onPress={() => onToggleInstallment(item.number)} style={styles.installment}>
          <Text style={styles.actionText}>Parcela {item.number} • {formatCurrency(item.amount)}</Text>
          <Text style={styles.meta}>{formatDateBR(item.due_date)} • {item.status === 'pago' ? 'Pago ✓' : 'Pendente — tocar para pagar'}</Text>
        </Pressable>
      ))}
      {record.notes ? <Text style={styles.notes}>{record.notes}</Text> : null}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" disabled={updating} onPress={onEdit} style={styles.action}>
          <Text style={styles.actionText}>Editar</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={updating} onPress={onToggleStatus} style={styles.action}>
          {updating ? <ActivityIndicator color={colors.text} size="small" /> : (
            <Text style={styles.actionText}>{paid ? 'Marcar pendente' : 'Marcar pago'}</Text>
          )}
        </Pressable>
        <Pressable accessibilityRole="button" disabled={updating} onPress={onDelete} style={[styles.action, styles.deleteAction]}>
          <Text style={[styles.actionText, styles.deleteText]}>Excluir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, padding: 16, backgroundColor: colors.surface },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  year: { color: colors.text, fontSize: 16, fontWeight: '800' },
  badge: { borderRadius: radii.round, paddingHorizontal: 10, paddingVertical: 4 },
  badgePending: { backgroundColor: colors.surfaceMuted },
  badgePaid: { backgroundColor: colors.successSoft },
  badgeOverdue: { backgroundColor: colors.dangerSoft },
  badgeText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  badgeTextPaid: { color: colors.success },
  badgeTextOverdue: { color: colors.danger },
  total: { marginTop: 4, color: colors.text, fontSize: 20, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  notes: { marginTop: 4, color: colors.text, fontSize: 13, lineHeight: 18 },
  installment: { minHeight: 52, gap: 5, justifyContent: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  action: { flexGrow: 1, minWidth: 94, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, paddingHorizontal: 10 },
  actionText: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  deleteAction: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  deleteText: { color: colors.danger },
});
