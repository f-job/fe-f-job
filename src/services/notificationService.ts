import api from './api';
import type {
  AppNotification,
  NotificationSettings,
  Paginated,
} from '@/types/api';

/**
 * In-app notifications API — backend prefix `/notifications`.
 * All endpoints require an authenticated token.
 */
const notificationService = {
  /** GET /notifications/unread-count — badge count. */
  unreadCount() {
    return api.get<{ count: number }>('/notifications/unread-count');
  },

  /** GET /notifications — paginated list. */
  list(page = 1, limit = 10) {
    return api.get<Paginated<AppNotification>>('/notifications', {
      params: { page, limit },
    });
  },

  /** PUT /notifications/read-all — mark every notification read. */
  markAllRead() {
    return api.put<{ modifiedCount: number }>('/notifications/read-all');
  },

  /** PUT /notifications/settings — update channel preferences. */
  updateSettings(payload: Partial<NotificationSettings>) {
    return api.put<NotificationSettings>('/notifications/settings', payload);
  },

  /** PUT /notifications/:id/read — mark a single notification read. */
  markRead(id: string) {
    return api.put<AppNotification>(`/notifications/${id}/read`);
  },

  /** DELETE /notifications/:id — soft-delete a notification. */
  remove(id: string) {
    return api.delete(`/notifications/${id}`);
  },
};

export default notificationService;
