import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentCard } from '../components/DocumentCard';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { getApiErrorMessage } from '../services/api';
import { documentService } from '../services/documentService';
import type { VehicleDocument } from '../types/document';
import type { AppStackParamList } from '../types/navigation';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Documents'>;

export function DocumentListScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDocuments = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      // A API já devolve do vencimento mais próximo para o mais distante.
      setDocuments(await documentService.list(vehicleId));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => {
    loadDocuments();
  }, [loadDocuments]));

  if (loading && documents.length === 0) {
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
          contentContainerStyle={documents.length ? styles.list : styles.emptyList}
          data={documents}
          keyExtractor={(item) => item.id}
          refreshControl={(
            <RefreshControl refreshing={refreshing} onRefresh={() => loadDocuments(true)} tintColor={colors.text} />
          )}
          renderItem={({ item }) => (
            <DocumentCard
              document={item}
              onPress={() => navigation.navigate('DocumentDetail', { vehicleId, documentId: item.id })}
            />
          )}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons color={colors.textMuted} name="document-text-outline" size={38} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum documento cadastrado</Text>
              <Text style={styles.emptyText}>Toque no + no topo da tela para cadastrar o CRLV, o seguro e outros.</Text>
            </View>
          )}
        />
      </View>
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
