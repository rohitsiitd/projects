import { apiFetch } from './client';
import { type GlobalRole, type User } from '../types/models';

export const adminApi = {
  updateUserGlobalRole: (
    userId: string | number,
    globalRole: GlobalRole,
  ): Promise<{ message: string; user: User }> =>
    apiFetch(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ globalRole }),
    }),
};
