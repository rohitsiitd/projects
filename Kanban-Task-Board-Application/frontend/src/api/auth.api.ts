import { apiFetch } from './client';
import { type User } from '../types/models';

export const authApi = {
  register: (data: {
    username: string;
    email: string;
    password: string;
  }): Promise<User> =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }): Promise<User> =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiFetch('/auth/logout', {
      method: 'POST',
    }),

  myProfile: (): Promise<User> => apiFetch('/auth/myprofile'),
};
