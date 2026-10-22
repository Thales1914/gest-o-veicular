import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { getApiErrorMessage } from '../services/api';
import { documentService } from '../services/documentService';
import { documentTypeLabels, type DocumentType } from '../types/document';
import type { AppStackParamList } from '../types/navigation';
import { parseExpenseDate } from '../utils/expensePeriod';
import { colors, radii } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'AddDocument'>;

type FieldErrors = { title?: string; issueDate?: string; expiryDate?: string };

const documentTypes = Object.keys(documentTypeLabels) as DocumentType[];

export function AddDocumentScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const [type, setType] = useState<DocumentType>('crlv');
  const [title, setTitle] = useState('');
  const [number, setNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setError('');
    // As datas são opcionais; quando preenchidas, precisam estar no formato DD/MM/AAAA.
    const issueIso = issueDate ? parseExpenseDate(issueDate) : undefined;
    const expiryIso = expiryDate ? parseExpenseDate(expiryDate) : undefined;

    const errors: FieldErrors = {};
    if (!title.trim()) errors.title = 'Dê um nome para o documento.';
    if (issueIso === null) errors.issueDate = 'Use uma data válida no formato DD/MM/AAAA.';
    if (expiryIso === null) errors.expiryDate = 'Use uma data válida no formato DD/MM/AAAA.';
    if (issueIso && expiryIso && issueIso > expiryIso) errors.expiryDate = 'O vencimento não pode ser antes da emissão.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await documentService.create(vehicleId, {
        type,
        title: title.trim(),
        number: number.trim() || undefined,
        issue_date: issueIso ?? undefined,
        expiry_date: expiryIso ?? undefined,
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <FeedbackMessage message={error} />
          <View style={styles.formCard}>
            <View style={styles.field}>
              <Text style={styles.label}>Tipo</Text>
              <View style={styles.chipRow}>
                {documentTypes.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: type === item }}
                    onPress={() => setType(item)}
                    style={[styles.chip, type === item ? styles.chipActive : undefined]}
                  >
                    <Text style={[styles.chipText, type === item ? styles.chipTextActive : undefined]}>
                      {documentTypeLabels[item]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <FormInput error={fieldErrors.title} icon="document-text-outline" label="Nome do documento"
              onChangeText={setTitle} placeholder="Ex: CRLV 2026" value={title} />
            <FormInput icon="barcode-outline" label="Número (opcional)"
              onChangeText={setNumber} placeholder="Ex: número da apólice" value={number} />
            <FormInput error={fieldErrors.issueDate} icon="calendar-outline" keyboardType="numbers-and-punctuation"
              label="Emissão (opcional)" maxLength={10} onChangeText={setIssueDate} placeholder="10/01/2026" value={issueDate} />
            <FormInput error={fieldErrors.expiryDate} icon="alarm-outline" keyboardType="numbers-and-punctuation"
              label="Vencimento (opcional)" maxLength={10} onChangeText={setExpiryDate} placeholder="31/12/2026" value={expiryDate} />
            <FormInput icon="create-outline" label="Observações (opcional)" multiline
              onChangeText={setNotes} placeholder="Ex: documento digital no app da seguradora" value={notes} />
            <PrimaryButton icon="add-circle-outline" title="Salvar documento" onPress={handleCreate} loading={loading} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, alignItems: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 520, gap: 18 },
  formCard: {
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 17,
    backgroundColor: colors.surface,
  },
  field: { gap: 7 },
  label: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.round,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.surface },
});
