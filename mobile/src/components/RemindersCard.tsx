import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../services/api';
import { reminderService, remindersSupported } from '../services/reminderService';
import { colors, radii } from '../utils/theme';
import { FeedbackMessage } from './FeedbackMessage';
import { PrimaryButton } from './PrimaryButton';

type Props = { vehicleId: string };

export function RemindersCard({ vehicleId }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [scheduled, setScheduled] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      const active = await reminderService.isEnabled();
      setEnabled(active);
      setScheduled(active ? await reminderService.sync(vehicleId) : null);
    } catch (syncError) {
      setError(getApiErrorMessage(syncError));
    }
  }, [vehicleId]);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  async function handleEnable() {
    setLoading(true);
    setError('');
    try {
      if (await reminderService.enable()) {
        await refresh();
      } else {
        setError('Permita as notificações do Gestão Veicular nas configurações do celular para receber os lembretes.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons color={colors.text} name={enabled ? 'notifications' : 'notifications-outline'} size={22} />
        <Text style={styles.title}>Lembretes</Text>
      </View>
      {!remindersSupported ? (
        <Text style={styles.text}>Os lembretes funcionam no app do celular.</Text>
      ) : enabled ? (
        <Text style={styles.text}>
          Ativados. Você recebe um aviso 7 dias antes e no dia do vencimento, e quando um cuidado estiver perto da quilometragem.
          {scheduled != null ? ` ${scheduled} lembrete(s) agendado(s) para este carro.` : ''}
        </Text>
      ) : (
        <>
          <Text style={styles.text}>Receba um aviso no celular antes de documentos, IPVA e cuidados vencerem.</Text>
          <PrimaryButton icon="notifications-outline" title="Ativar lembretes" onPress={handleEnable} loading={loading} />
        </>
      )}
      <FeedbackMessage message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    padding: 14,
    backgroundColor: colors.surface,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.text, fontSize: 15, fontWeight: '800' },
  text: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
