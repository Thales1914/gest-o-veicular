import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { IpvaCard } from '../components/IpvaCard';
import { getApiErrorMessage } from '../services/api';
import { ipvaService } from '../services/ipvaService';
import type { IpvaRecord } from '../types/ipva';
import type { AppStackParamList } from '../types/navigation';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Ipva'>;

export function IpvaListScreen({ route }: Props) {
  const { vehicleId } = route.params;
  const [records, setRecords] = useState<IpvaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<IpvaRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadRecords = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      setRecords(await ipvaService.list(vehicleId));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => {
    loadRecords();
  }, [loadRecords]));

  // Troca o status entre pago e pendente, mandando o registro completo para a API.
  async function toggleStatus(record: IpvaRecord) {
    setUpdatingId(record.id);
    setError('');
    try {
      const updated = await ipvaService.update(vehicleId, record.id, {
        year: record.year,
        total_value: record.total_value,
        installments: record.installments,
        due_date: record.due_date,
        status: record.status === 'pago' ? 'pendente' : 'pago',
        notes: record.notes,
      });
      setRecords((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await ipvaService.remove(vehicleId, toDelete.id);
      setRecords((current) => current.filter((item) => item.id !== toDelete.id));
      setToDelete(null);
    } catch (requestError) {
      setDeleteError(getApiErrorMessage(requestError));
    } finally {
      setDeleting(false);
    }
  }

  if (loading && records.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.shell}>
        <FeedbackMessage message={error} />
        <FlatList
          contentContainerStyle={records.length ? styles.list : styles.emptyList}
          data={records}
          keyExtractor={(item) => item.id}
          refreshControl={(
            <RefreshControl refreshing={refreshing} onRefresh={() => loadRecords(true)} tintColor={colors.text} />
          )}
          renderItem={({ item }) => (
            <IpvaCard
              record={item}
              updating={updatingId === item.id}
              onToggleStatus={() => toggleStatus(item)}
              onDelete={() => { setDeleteError(''); setToDelete(item); }}
            />
          )}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons color={colors.textMuted} name="receipt-outline" size={38} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum IPVA cadastrado</Text>
              <Text style={styles.emptyText}>Toque no + no topo da tela para cadastrar o IPVA do ano.</Text>
            </View>
          )}
        />
      </View>
      <ConfirmDialog
        visible={toDelete != null}
        title="Excluir IPVA?"
        message={toDelete ? `O IPVA ${toDelete.year} será excluído. Essa ação não pode ser desfeita.` : ''}
        confirmLabel="Confirmar exclusão"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  shell: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  list: { gap: 10, paddingVertical: 14, paddingBottom: 30 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 8, padding: 24 },
  emptyIcon: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 38,
    backgroundColor: colors.surface,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyText: { maxWidth: 270, color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
