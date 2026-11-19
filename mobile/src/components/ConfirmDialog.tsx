import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../utils/theme';
import { FeedbackMessage } from './FeedbackMessage';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
  error?: string;
  onConfirm(): void;
  onCancel(): void;
};

// Janela de confirmação que funciona igual no celular e no navegador.
export function ConfirmDialog({ visible, title, message, confirmLabel, loading = false, error, onConfirm, onCancel }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => { if (!loading) onCancel(); }}>
      <View style={styles.overlay}>
        <View accessibilityViewIsModal style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <FeedbackMessage message={error ?? ''} />
          <PrimaryButton title={confirmLabel} icon="trash-outline" onPress={onConfirm} loading={loading} />
          <Pressable accessibilityRole="button" disabled={loading} onPress={onCancel} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.4)' },
  card: { width: '100%', maxWidth: 420, gap: 12, borderRadius: radii.large, padding: 20, backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  message: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  cancel: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
