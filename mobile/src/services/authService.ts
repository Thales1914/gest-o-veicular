import { api } from './api';
import type { LoginInput, RegisterInput, Session, User } from '../types/auth';

export const authService = {
  async register(input: RegisterInput) {
    const response = await api.post<{ user: User }>('/auth/register', input);
    return response.data.user;
  },

  async login(input: LoginInput) {
    const response = await api.post<Session>('/auth/login', input);
    return response.data;
  },
};
