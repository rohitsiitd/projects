import { apiFetch } from './client';
import { type Notification } from '../types/models';

export const notificationApi = {
  //Get all notifications of current user:
  getNotifications: (): Promise<{ notifications: Notification[] }> =>
    apiFetch(`/notifications`),

  //Read notification of current user:
  markAsRead: (notificationId: string): Promise<Notification> =>
    apiFetch(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),
};
