import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { planReminders } from '../utils/reminders';
import { careService } from './careService';
import { deadlineService } from './deadlineService';
import { vehicleService } from './vehicleService';

const CHANNEL_ID = 'lembretes';

// Mostra o aviso mesmo com o app aberto.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Notificações locais só existem no celular; no navegador os lembretes ficam desligados.
export const remindersSupported = Platform.OS !== 'web';

async function prepareChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Lembretes de vencimento',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export const reminderService = {
  async isEnabled() {
    if (!remindersSupported) return false;
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  },

  async enable() {
    if (!remindersSupported) return false;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  // Remove os lembretes agendados de um veículo (identificador começa com o id dele).
  async cancelVehicle(vehicleId: string) {
    if (!remindersSupported) return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled
      .filter((item) => item.identifier.startsWith(`veiculo-${vehicleId}:`))
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
  },

  // Busca vencimentos e cuidados do veículo e reagenda os lembretes do zero.
  async sync(vehicleId: string) {
    if (!(await this.isEnabled())) return 0;
    await prepareChannel();
    const [vehicle, deadlines, care] = await Promise.all([
      vehicleService.detail(vehicleId),
      deadlineService.summary(vehicleId, 365),
      careService.summary(vehicleId),
    ]);
    const plan = planReminders(`${vehicle.brand} ${vehicle.model}`, deadlines.items, care.items);

    await this.cancelVehicle(vehicleId);
    for (const reminder of plan) {
      await Notifications.scheduleNotificationAsync({
        identifier: `veiculo-${vehicleId}:${reminder.id}`,
        content: { title: reminder.title, body: reminder.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.date, channelId: CHANNEL_ID },
      });
    }
    return plan.length;
  },
};
