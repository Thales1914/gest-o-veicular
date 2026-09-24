import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { FuelRecordCard } from '../components/FuelRecordCard';
import { getApiErrorMessage } from '../services/api';
import { fuelService } from '../services/fuelService';
import type { AppStackParamList } from '../types/navigation';
import type { FuelRecord } from '../types/fuelRecord';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'FuelRecords'>;

export function FuelRecordListScreen({ route }: Props) {
  const { vehicleId } = route.params;
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadRecords = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');

    try {
      setRecords(await fuelService.list(vehicleId));
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
          keyExtractor={(item) => String(item.id)}
          refreshControl={(
            <RefreshControl refreshing={refreshing} onRefresh={() => loadRecords(true)} tintColor={colors.text} />
          )}
          renderItem={({ item }) => <FuelRecordCard record={item} />}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons color={colors.textMuted} name="water-outline" size={38} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum abastecimento registrado</Text>
              <Text style={styles.emptyText}>Toque no + no topo da tela para registrar o primeiro.</Text>
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
