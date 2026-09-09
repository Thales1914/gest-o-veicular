import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { VehicleCard } from '../components/VehicleCard';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../services/api';
import { vehicleService } from '../services/vehicleService';
import type { AppStackParamList } from '../types/navigation';
import type { Vehicle } from '../types/vehicle';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'VehicleList'>;

export function VehicleListScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadVehicles = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');

    try {
      setVehicles(await vehicleService.list());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadVehicles();
  }, [loadVehicles]));

  if (loading && vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.loadingIcon}>
          <Ionicons color={colors.text} name="car-sport-outline" size={32} />
        </View>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Carregando sua garagem...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Meus carros</Text>
            <Text style={styles.subtitle}>{vehicles.length} {vehicles.length === 1 ? 'veículo cadastrado' : 'veículos cadastrados'}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Cadastrar veículo"
              accessibilityRole="button"
              onPress={() => navigation.navigate('AddVehicle')}
              style={styles.iconButton}
            >
              <Ionicons color={colors.text} name="add" size={23} />
            </Pressable>
            <Pressable
              accessibilityLabel="Sair da conta"
              accessibilityRole="button"
              onPress={signOut}
              style={styles.iconButton}
            >
              <Ionicons color={colors.text} name="log-out-outline" size={21} />
            </Pressable>
          </View>
        </View>

        <FeedbackMessage message={error} />
        <FlatList
          contentContainerStyle={vehicles.length ? styles.list : styles.emptyList}
          data={vehicles}
          keyExtractor={(item) => String(item.id)}
          refreshControl={(
            <RefreshControl refreshing={refreshing} onRefresh={() => loadVehicles(true)} tintColor={colors.text} />
          )}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              onPress={() => navigation.navigate('VehicleHome', { vehicleId: String(item.id) })}
            />
          )}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons color={colors.textMuted} name="car-outline" size={42} />
              </View>
              <Text style={styles.emptyTitle}>Sua garagem está vazia</Text>
              <Text style={styles.emptyText}>Use o botão "+" para cadastrar seu primeiro carro.</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.background },
  loadingIcon: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 31,
    backgroundColor: colors.surface,
  },
  loadingText: { color: colors.textMuted, fontSize: 13 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 14,
  },
  title: { color: colors.text, fontSize: 25, fontWeight: '800' },
  subtitle: { marginTop: 3, color: colors.textMuted, fontSize: 12 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  list: { gap: 10, paddingVertical: 6, paddingBottom: 30 },
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
  emptyTitle: { color: colors.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  emptyText: { maxWidth: 270, color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
