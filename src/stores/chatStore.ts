import { create } from 'zustand';
import chatService from '@services/chatService';

interface ChatState {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  refreshUnreadCount: () => Promise<void>;
  incrementUnread: () => void;
  reset: () => void;
}

/**
 * Lightweight global store for the chat unread-message badge.
 * Polled by the navbar and bumped by inbound socket messages.
 */
export const useChatStore = create<ChatState>((set) => ({
  unreadCount: 0,

  setUnreadCount: (n: number) => set({ unreadCount: Math.max(0, n) }),

  refreshUnreadCount: async () => {
    try {
      const { data } = await chatService.unreadCount();
      set({ unreadCount: data.count });
    } catch {
      // silent — badge is non-critical
    }
  },

  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),

  reset: () => set({ unreadCount: 0 }),
}));
