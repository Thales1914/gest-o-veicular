import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { getApiErrorMessage } from '../services/api';
import { documentService } from '../services/documentService';
import { documentTypeLabels, type VehicleDocument } from '../types/document';
import type { AppStackParamList } from '../types/navigation';
import { daysUntil, dueLabel } from '../utils/dueDate';
import { formatDateBR } from '../utils/formatters';
import { colors, radii } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'DocumentDetail'>;

export function DocumentDetailScreen({ route, navigation }: Props) {
  const { vehicleId, documentId } = route.params;
  const [document, setDocument] = useState<VehicleDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadDocument = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setDocument(await documentService.detail(vehicleId, documentId));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [vehicleId, documentId]);

  useFocusEffect(useCallback(() => {
    loadDocument();
  }, [loadDocument]));

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      await documentService.remove(vehicleId, documentId);
      setConfirmDelete(false);
      navigation.goBack();
    } catch (requestError) {
      setDeleteError(getApiErrorMessage(requestError));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!document) {
    return (
      <View style={styles.center}>
        <FeedbackMessage message={error || 'Documento não encontrado.'} />
      </View>
    );
  }

  const rows = [
    { label: 'Tipo', value: documentTypeLabels[document.type] },
    { label: 'Número', value: document.number ?? 'Não informado' },
    { label: 'Emissão', value: document.issue_date ? formatDateBR(document.issue_date) : 'Não informada' },
    { label: 'Vencimento', value: document.expiry_date ? formatDateBR(document.expiry_date) : 'Sem vencimento' },
  ];
  if (document.expiry_date) rows.push({ label: 'Situação', value: dueLabel(daysUntil(document.expiry_date)) });

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{document.title}</Text>
          <View style={styles.card}>
            {rows.map((row, index) => (
              <View key={row.label} style={[styles.row, index === rows.length - 1 ? styles.lastRow : undefined]}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </View>
          {document.notes ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>Observações</Text>
              <Text style={styles.notesText}>{document.notes}</Text>
            </View>
          ) : null}
          <Pressable
            accessibilityLabel="Excluir documento"
            accessibilityRole="button"
            onPress={() => { setDeleteError(''); setConfirmDelete(true); }}
            style={styles.deleteButton}
          >
            <Ionicons color={colors.danger} name="trash-outline" size={17} />
            <Text style={styles.deleteText}>Excluir documento</Text>
          </Pressable>
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={confirmDelete}
        title="Excluir documento?"
        message={`${document.title} será excluído. Essa ação não pode ser desfeita.`}
        confirmLabel="Confirmar exclusão"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, alignItems: 'center', padding: 20, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 520, gap: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  row: {
    minHeight: 48,
    gap: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: { flex: 1, minWidth: 0, color: colors.textMuted, fontSize: 13 },
  rowValue: { flex: 1, minWidth: 0, textAlign: 'right', color: colors.text, fontSize: 14, fontWeight: '700' },
  notesCard: {
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: 14,
    backgroundColor: colors.surface,
  },
  notesLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  notesText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.medium,
    paddingVertical: 13,
    backgroundColor: colors.dangerSoft,
  },
  deleteText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
});
