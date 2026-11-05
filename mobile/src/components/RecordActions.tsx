import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../services/api';
import { colors, radii } from '../utils/theme';
import { FeedbackMessage } from './FeedbackMessage';
import { PrimaryButton } from './PrimaryButton';

type Props = { label: string; onEdit: () => void; onDelete: () => Promise<void>; onDeleted: () => void };

export function RecordActions({ label, onEdit, onDelete, onDeleted }: Props) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  async function remove() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await onDelete();
      setConfirm(false);
      onDeleted();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return <View style={styles.actions}>
    <PrimaryButton title={`Editar ${label}`} icon="create-outline" onPress={onEdit} />
    <Pressable accessibilityRole="button" onPress={() => { setError(''); setConfirm(true); }} style={styles.button}>
      <Text style={styles.danger}>Excluir {label}</Text>
    </Pressable>
    <Modal transparent visible={confirm} animationType="fade" onRequestClose={() => { if (!busy) setConfirm(false); }}>
      <View style={styles.overlay}>
        <View accessibilityViewIsModal style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>Excluir {label}?</Text>
          <Text style={styles.text}>O registro será removido do histórico e dos gastos. Essa ação não pode ser desfeita.</Text>
          <FeedbackMessage message={error} />
          <PrimaryButton title="Confirmar exclusão" icon="trash-outline" loading={busy} onPress={remove} />
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => setConfirm(false)} style={styles.button}>
            <Text style={styles.text}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  actions: { gap: 10 },
  button: { minHeight: 46, alignItems: 'center', justifyContent: 'center', padding: 12 },
  danger: { color: colors.danger, fontWeight: '700' },
  overlay: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  card: { width: '100%', maxWidth: 420, padding: 22, gap: 16, backgroundColor: colors.surface, borderRadius: radii.large },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  text: { color: colors.textMuted, lineHeight: 22 },
});
