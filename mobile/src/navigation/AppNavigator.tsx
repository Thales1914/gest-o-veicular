import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AddVehicleScreen } from '../screens/AddVehicleScreen';
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
    </Stack.Navigator>
  );
}
