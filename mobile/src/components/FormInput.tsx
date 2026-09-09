import { Ionicons } from '@expo/vector-icons';
import { forwardRef, type ComponentProps, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { colors, radii } from '../utils/theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
};

export const FormInput = forwardRef<TextInput, Props>(function FormInput(
  { label, error, icon, secureTextEntry, onFocus, onBlur, style, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputShell,
        focused ? styles.inputFocused : undefined,
        error ? styles.inputError : undefined,
      ]}>
        {icon ? <Ionicons color={colors.textMuted} name={icon} size={19} /> : null}
        <TextInput
          ref={ref}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={colors.textSubtle}
          secureTextEntry={secureTextEntry && !passwordVisible}
          style={[styles.input, style]}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setPasswordVisible((visible) => !visible)}
          >
            <Ionicons
              color={colors.textMuted}
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 7 },
  label: { color: colors.text, fontSize: 13, fontWeight: '600' },
  inputShell: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
  },
  inputFocused: { borderColor: colors.primary },
  input: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 0,
    color: colors.text,
    fontSize: 15,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13 },
});
