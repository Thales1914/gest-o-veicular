import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { SelectedDocumentFile } from '../types/document';
import { colors } from '../utils/theme';
import { FeedbackMessage } from './FeedbackMessage';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  value: SelectedDocumentFile | null;
  onChange: (file: SelectedDocumentFile | null) => void;
  disabled?: boolean;
  existingFileName?: string;
};

export function DocumentAttachmentPicker({ value, onChange, disabled, existingFileName }: Props) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const picking = useRef(false);

  async function pick(source: 'file' | 'photo' | 'camera') {
    if (picking.current || disabled) return;
    picking.current = true;
    setBusy(true);
    setError('');

    try {
      let file: SelectedDocumentFile;
      if (source === 'file') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif'],
          copyToCacheDirectory: true,
          multiple: false,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        file = {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? 'application/octet-stream',
          size: asset.size,
          file: asset.file,
        };
      } else {
        if (source === 'camera') {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            setError('Permita o acesso à câmera nas configurações do celular.');
            return;
          }
        } else {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            setError('Permita o acesso às fotos nas configurações do celular.');
            return;
          }
        }

        const options: ImagePicker.ImagePickerOptions = {
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: false,
        };
        const result = source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
        if (result.canceled) return;
        const asset = result.assets[0];
        file = {
          uri: asset.uri,
          name: asset.fileName ?? 'foto.jpg',
          mimeType: asset.mimeType ?? 'image/jpeg',
          size: asset.fileSize,
          file: asset.file,
        };
      }

      if (file.size != null && file.size > 10 * 1024 * 1024) {
        setError('O arquivo deve ter no máximo 10 MB.');
        return;
      }
      onChange(file);
    } catch {
      setError('Não foi possível selecionar o arquivo. Tente novamente.');
    } finally {
      picking.current = false;
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Arquivo ou foto (opcional)</Text>
      <Text style={styles.hint}>PDF, JPG, PNG ou HEIC, até 10 MB.</Text>
      {existingFileName && !value ? <Text style={styles.current}>Arquivo atual: {existingFileName}</Text> : null}
      {value ? (
        <>
          <Text numberOfLines={2} style={styles.current}>Novo arquivo: {value.name}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={disabled || busy}
            onPress={() => onChange(null)}
            style={styles.remove}
          >
            <Text style={styles.removeText}>Remover seleção</Text>
          </Pressable>
        </>
      ) : null}
      <FeedbackMessage message={error} />
      <PrimaryButton title="Selecionar arquivo" icon="attach-outline" onPress={() => pick('file')} disabled={disabled || busy} />
      <PrimaryButton title="Escolher foto" icon="images-outline" onPress={() => pick('photo')} disabled={disabled || busy} />
      {Platform.OS !== 'web' ? (
        <PrimaryButton title="Tirar foto" icon="camera-outline" onPress={() => pick('camera')} disabled={disabled || busy} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { color: colors.text, fontWeight: '600' },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  current: { color: colors.text, fontSize: 13, lineHeight: 19 },
  remove: { minHeight: 44, justifyContent: 'center' },
  removeText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
});
