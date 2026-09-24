import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavigation } from '../components/BottomNavigation';
import { FeedbackMessage } from '../components/FeedbackMessage';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../services/api';
import { vehicleService } from '../services/vehicleService';
import type { AppStackParamList } from '../types/navigation';
import type { Vehicle } from '../types/vehicle';
import { formatMileage } from '../utils/formatters';
import { colors, radii } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'VehicleHome'>;

type IconName = ComponentProps<typeof Ionicons>['name'];

type VehicleModule = { label: string; icon: IconName; screen?: 'FuelRecords' };

const vehicleModules: VehicleModule[] = [
  { label: 'Manutenções', icon: 'construct-outline' },
  { label: 'Abastecimentos', icon: 'water-outline', screen: 'FuelRecords' },
  { label: 'Gastos', icon: 'wallet-outline' },
  { label: 'Documentos', icon: 'document-text-outline' },
  { label: 'Histórico', icon: 'time-outline' },
];

export function VehicleHomeScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadVehicle = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setVehicle(await vehicleService.detail(route.params.vehicleId));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [route.params.vehicleId]);

  useFocusEffect(useCallback(() => {
    loadVehicle();
  }, [loadVehicle]));

  function handleDelete() {
    if (!vehicle) return;

    Alert.alert(
      'Excluir veículo',
      `Tem certeza que deseja excluir ${vehicle.brand} ${vehicle.model}? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            setError('');
            try {
              await vehicleService.remove(vehicle.id);
              navigation.navigate('VehicleList');
            } catch (deleteError) {
              setError(getApiErrorMessage(deleteError));
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.loadingIcon}>
          <Ionicons color={colors.text} name="car-sport-outline" size={34} />
        </View>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <FeedbackMessage message={error || 'Veículo não encontrado.'} />
        <PrimaryButton title="Tentar novamente" onPress={loadVehicle} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.shell}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Olá, {user?.name.split(' ')[0] ?? 'motorista'}!</Text>
              <Text style={styles.greetingHint}>Tudo certo com seu carro?</Text>
            </View>
            <Pressable
              accessibilityLabel="Notificações - em breve"
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              disabled
              style={styles.headerIcon}
            >
              <Ionicons color={colors.text} name="notifications-outline" size={21} />
            </Pressable>
          </View>

          <FeedbackMessage message={error} />

          <View style={styles.vehicleCard}>
            <View style={styles.vehicleTop}>
              <View style={styles.carIcon}>
                <Ionicons color={colors.text} name="car-sport-outline" size={50} />
              </View>
              <View style={styles.vehicleDetails}>
                <Text style={styles.title}>{vehicle.brand} {vehicle.model}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaTag}>{vehicle.year}</Text>
                  <Text style={styles.metaTag}>{vehicle.plate}</Text>
                </View>
              </View>
            </View>
            <View style={styles.mileageBox}>
              <View>
                <Text style={styles.mileageLabel}>Quilometragem atual</Text>
                <Text style={styles.mileage}>{formatMileage(vehicle.current_mileage)}</Text>
              </View>
              <Ionicons color={colors.textMuted} name="speedometer-outline" size={30} />
            </View>
            <View style={styles.vehicleActions}>
              <Pressable
                accessibilityLabel="Editar veículo"
                accessibilityRole="button"
                onPress={() => navigation.navigate('EditVehicle', { vehicleId: vehicle.id })}
                style={styles.actionButton}
              >
                <Ionicons color={colors.text} name="create-outline" size={17} />
                <Text style={styles.actionButtonText}>Editar</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Excluir veículo"
                accessibilityRole="button"
                disabled={deleting}
                onPress={handleDelete}
                style={[styles.actionButton, styles.deleteButton]}
              >
                {deleting
                  ? <ActivityIndicator color={colors.danger} size="small" />
                  : <Ionicons color={colors.danger} name="trash-outline" size={17} />}
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Excluir</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Próximos cuidados</Text>
              <Text style={styles.sectionAction}>Em breve</Text>
            </View>
            <View style={styles.careCard}>
              <View style={styles.careRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
                <Text style={styles.careName}>Troca de óleo</Text>
                <Text style={styles.careValue}>A programar</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.careRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={styles.careName}>Revisão</Text>
                <Text style={styles.careValue}>A programar</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.careRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.textSubtle }]} />
                <Text style={styles.careName}>Documentos</Text>
                <Text style={styles.careValue}>A programar</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acessos do veículo</Text>
            <Text style={styles.sectionHint}>Os demais módulos serão habilitados nas próximas etapas.</Text>
            <View style={styles.moduleGrid}>
              {vehicleModules.map((module) => (
                <Pressable
                  key={module.label}
                  accessibilityState={{ disabled: !module.screen }}
                  disabled={!module.screen}
                  onPress={module.screen ? () => navigation.navigate(module.screen!, { vehicleId: vehicle.id }) : undefined}
                  style={styles.moduleCard}
                >
                  <View style={styles.moduleIcon}>
                    <Ionicons color={colors.text} name={module.icon} size={22} />
                  </View>
                  <Text style={styles.moduleTitle}>{module.label}</Text>
                  <Text style={styles.soon}>{module.screen ? 'Ver registros' : 'Em breve'}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
        <BottomNavigation
          onAdd={() => navigation.navigate('AddVehicle')}
          onFuel={() => navigation.navigate('FuelRecords', { vehicleId: vehicle.id })}
          onHome={() => navigation.navigate('VehicleList')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  shell: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
  loadingIcon: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 35,
    backgroundColor: colors.surface,
  },
  errorContainer: { flex: 1, justifyContent: 'center', gap: 18, padding: 24, backgroundColor: colors.background },
  container: { padding: 18, paddingBottom: 30, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { color: colors.text, fontSize: 23, fontWeight: '800' },
  greetingHint: { marginTop: 2, color: colors.textMuted, fontSize: 12 },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  vehicleCard: {
    gap: 15,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.large,
    padding: 17,
    backgroundColor: colors.surface,
  },
  vehicleTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  carIcon: {
    width: 82,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.medium,
    backgroundColor: colors.surfaceMuted,
  },
  vehicleDetails: { flex: 1, gap: 9 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaTag: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.round,
    paddingHorizontal: 9,
    paddingVertical: 4,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  mileageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.medium,
    padding: 13,
    backgroundColor: colors.surfaceMuted,
  },
  mileageLabel: { color: colors.textMuted, fontSize: 11 },
  mileage: { marginTop: 2, color: colors.text, fontSize: 22, fontWeight: '800' },
  vehicleActions: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    backgroundColor: colors.surfaceMuted,
  },
  actionButtonText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  deleteButton: { borderColor: colors.dangerSoft, backgroundColor: colors.dangerSoft },
  deleteButtonText: { color: colors.danger },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  sectionAction: { color: colors.textSubtle, fontSize: 11, fontWeight: '600' },
  sectionHint: { marginBottom: 5, color: colors.textMuted, fontSize: 12 },
  careCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
  },
  careRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  careName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '600' },
  careValue: { color: colors.textMuted, fontSize: 11 },
  divider: { height: 1, backgroundColor: colors.border },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moduleCard: {
    width: '48%',
    minHeight: 112,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: 13,
    backgroundColor: colors.surface,
  },
  moduleIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
  },
  moduleTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  soon: { marginTop: 3, color: colors.textSubtle, fontSize: 10 },
});
