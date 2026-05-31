import api from './api';
import type {
  ChatMessage,
  Conversation,
  Paginated,
} from '@/types/api';

/**
 * Chat & messaging REST API — backend prefix `/conversations`.
 * Real-time delivery uses the Socket.io `/chat` namespace (see chatSocket.ts);
 * these REST endpoints serve as history loading + HTTP fallback.
 */
const chatService = {
  /** GET /conversations/unread-count — global unread message badge. */
  unreadCount() {
    return api.get<{ count: number }>('/conversations/unread-count');
  },

  /** GET /conversations — own conversation list. */
  list() {
    return api.get<{ data: Conversation[] }>('/conversations');
  },

  /** POST /conversations — start (or reopen) a conversation with a recipient. */
  create(recipientId: string) {
    return api.post<Conversation>('/conversations', { recipientId });
  },

  /** GET /conversations/:id — single conversation metadata. */
  getById(id: string) {
    return api.get<Conversation>(`/conversations/${id}`);
  },

  /** GET /conversations/:id/messages — paginated message history. */
  messages(id: string, page = 1, limit = 20) {
    return api.get<Paginated<ChatMessage>>(`/conversations/${id}/messages`, {
      params: { page, limit },
    });
  },

  /** POST /conversations/:id/messages — send a message (HTTP fallback). */
  sendMessage(id: string, text: string) {
    return api.post<ChatMessage>(`/conversations/${id}/messages`, { text });
  },

  /** PUT /conversations/:id/messages/:messageId/read — mark a message read. */
  markRead(id: string, messageId: string) {
    return api.put(`/conversations/${id}/messages/${messageId}/read`);
  },

  /** DELETE /conversations/:id — hide (soft-delete) a conversation. */
  hide(id: string) {
    return api.delete(`/conversations/${id}`);
  },
};

export default chatService;
