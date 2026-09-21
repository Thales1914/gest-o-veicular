import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { AddFuelRecordScreen } from '../screens/AddFuelRecordScreen';
import { AddVehicleScreen } from '../screens/AddVehicleScreen';
import { EditVehicleScreen } from '../screens/EditVehicleScreen';
import { FuelRecordListScreen } from '../screens/FuelRecordListScreen';
import { VehicleHomeScreen } from '../screens/VehicleHomeScreen';
import { VehicleListScreen } from '../screens/VehicleListScreen';
import type { AppStackParamList } from '../types/navigation';
import { colors } from '../utils/theme';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="VehicleList"
        component={VehicleListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddVehicle"
        component={AddVehicleScreen}
        options={{ title: 'Cadastrar carro', headerBackTitle: 'Voltar' }}
      />
      <Stack.Screen
        name="VehicleHome"
        component={VehicleHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditVehicle"
        component={EditVehicleScreen}
        options={{ title: 'Editar carro', headerBackTitle: 'Voltar' }}
      />
      <Stack.Screen
        name="FuelRecords"
        component={FuelRecordListScreen}
        options={({ navigation, route }) => ({
          title: 'Abastecimentos',
          headerBackTitle: 'Voltar',
          headerRight: () => (
            <Pressable
              accessibilityLabel="Registrar abastecimento"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => navigation.navigate('AddFuelRecord', { vehicleId: route.params.vehicleId })}
            >
              <Ionicons color={colors.text} name="add" size={24} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="AddFuelRecord"
        component={AddFuelRecordScreen}
        options={{ title: 'Registrar abastecimento', headerBackTitle: 'Voltar' }}
      />
    </Stack.Navigator>
  );
}
