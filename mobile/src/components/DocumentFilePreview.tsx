import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import { api, getApiErrorMessage } from '../services/api';
import type { VehicleDocument } from '../types/document';
import { colors } from '../utils/theme';
import { FeedbackMessage } from './FeedbackMessage';
import { PrimaryButton } from './PrimaryButton';

type Props = { vehicleId: string; document: VehicleDocument };

export function DocumentFilePreview({ vehicleId, document: record }: Props) {
  const [uri, setUri] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [revision, setRevision] = useState(0);
  const attachment = record.attachment;

  useEffect(() => {
    const currentAttachment = attachment;
    if (!currentAttachment) {
      setLoading(false);
      return;
    }
    const verifiedAttachment = currentAttachment;

    let active = true;
    let cached = '';
    setUri('');
    setLoading(true);
    setError('');

    function release() {
      if (!cached) return;
      if (Platform.OS === 'web') URL.revokeObjectURL(cached);
      else FileSystem.deleteAsync(cached, { idempotent: true }).catch(() => undefined);
      cached = '';
    }

    async function load() {
      try {
        const path = `/vehicles/${vehicleId}/documents/${record.id}/file`;
        if (Platform.OS === 'web') {
          const response = await api.get<Blob>(path, { responseType: 'blob', timeout: 60000 });
          cached = URL.createObjectURL(response.data);
        } else {
          if (!FileSystem.cacheDirectory) throw new Error('Cache indisponível.');
          const extension = verifiedAttachment.mime_type === 'application/pdf' ? 'pdf' : verifiedAttachment.mime_type.split('/')[1];
          cached = `${FileSystem.cacheDirectory}document-${record.id}-${Date.now()}.${extension}`;
          const authorization = api.defaults.headers.common.Authorization;
          const result = await FileSystem.downloadAsync(
            `${api.defaults.baseURL?.replace(/\/$/, '')}${path}`,
            cached,
            { headers: authorization ? { Authorization: String(authorization) } : {} },
          );
          if (result.status !== 200) throw new Error('Falha ao abrir o arquivo.');
        }

        if (active) setUri(cached);
        else release();
      } catch (loadError) {
        release();
        if (active) setError(getApiErrorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
      release();
    };
  }, [vehicleId, record.id, record.updated_at, attachment?.name, attachment?.mime_type, revision]);

  if (!attachment) return <Text style={styles.hint}>Nenhum arquivo anexado a este documento.</Text>;

  async function openFile() {
    const currentAttachment = attachment;
    if (!uri || sharing || !currentAttachment) return;
    setSharing(true);
    setError('');
    try {
      if (Platform.OS === 'web') {
        const link = globalThis.document.createElement('a');
        link.href = uri;
        link.download = currentAttachment.name;
        link.click();
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: currentAttachment.mime_type, dialogTitle: currentAttachment.name });
      } else {
        setError('O compartilhamento não está disponível neste aparelho.');
      }
    } catch {
      setError('Não foi possível abrir o arquivo. Tente novamente.');
    } finally {
      setSharing(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text numberOfLines={2} style={styles.title}>{attachment.name}</Text>
      <Text style={styles.hint}>{Math.ceil(attachment.size / 1024)} KB</Text>
      <FeedbackMessage message={error} />
      {loading ? <ActivityIndicator accessibilityLabel="Abrindo arquivo" color={colors.primary} /> : null}
      {error && !uri ? <PrimaryButton title="Tentar abrir novamente" onPress={() => setRevision((value) => value + 1)} /> : null}
      {uri && attachment.mime_type.startsWith('image/') ? (
        <Image accessibilityLabel="Foto do documento" source={{ uri }} resizeMode="contain" style={styles.image} />
      ) : null}
      {uri && attachment.mime_type === 'application/pdf' && Platform.OS === 'web' ? (
        <iframe title="Arquivo PDF do documento" src={uri} style={{ width: '100%', height: 420, border: 0 }} />
      ) : null}
      {uri && attachment.mime_type === 'application/pdf' && Platform.OS === 'ios' ? (
        <View style={styles.pdf}>
          <WebView
            source={{ uri }}
            originWhitelist={['file://*']}
            javaScriptEnabled={false}
            allowingReadAccessToURL={uri}
            onShouldStartLoadWithRequest={(request) => request.url === uri || request.url === 'about:blank'}
          />
        </View>
      ) : null}
      {uri ? (
        <PrimaryButton
          title={Platform.OS === 'web' ? 'Baixar arquivo' : 'Abrir ou compartilhar'}
          icon="open-outline"
          onPress={openFile}
          loading={sharing}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { color: colors.text, fontSize: 15, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 12 },
  image: { width: '100%', height: 320 },
  pdf: { height: 420 },
});
