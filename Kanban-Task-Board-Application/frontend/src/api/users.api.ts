import { apiFetch } from './client';
import type { PaginatedResponse, User } from '../types/models';

export const usersApi = {
  getUsers: async ({
    page = 1,
    limit = 10,
    search = '',
  }: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (search.trim()) {
      params.set('search', search.trim());
    }

    const response = await apiFetch<{
      users: User[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/users?${params.toString()}`);

    return {
      items: response.users,
      ...response.pagination,
    };
  },

  uploadAvatar: (file: File): Promise<{ message: string; avatar: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    return apiFetch('/users/avatars', {
      method: 'PATCH',
      body: formData,
    });
  },
};
