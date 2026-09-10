import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppStackParamList } from '../types/navigation';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'VehicleHome'>;

export function VehicleHomeScreen({ route }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Veículo {route.params.vehicleId}</Text>
        <Text style={styles.subtitle}>Tela inicial do veículo (em construção).</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { alignItems: 'center', gap: 10, padding: 24 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14 },
});
