import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppStackParamList } from '../types/navigation';
import { colors } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'VehicleList'>;

export function VehicleListScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Meus carros</Text>
        <Text style={styles.subtitle}>Lista de veículos (em construção).</Text>
        <Pressable onPress={() => navigation.navigate('AddVehicle')} style={styles.link}>
          <Text style={styles.linkText}>Cadastrar veículo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { alignItems: 'center', gap: 10, padding: 24 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14 },
  link: { marginTop: 8, padding: 8 },
  linkText: { color: colors.text, fontWeight: '700' },
});
