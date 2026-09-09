import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';

const developmentUrl = Platform.OS === 'android'
  ? 'http://10.0.2.2:3333'
  : 'http://localhost:3333';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? developmentUrl,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

type ApiErrorBody = {
  message?: string;
  errors?: Array<{ field: string; message: string }>;
};

export function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorBody | undefined;
    return data?.errors?.[0]?.message
      ?? data?.message
      ?? (error.code === 'ECONNABORTED'
        ? 'A API demorou para responder.'
        : 'Não foi possível conectar à API.');
  }

  return 'Ocorreu um erro inesperado.';
}
