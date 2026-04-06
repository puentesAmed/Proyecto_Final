import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useNotifications = create(
  persist(
    (set) => ({
      items: [],
      push: (notification) =>
        set((state) => ({
          items: [
            {
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              read: false,
              ...notification,
            },
            ...state.items,
          ].slice(0, 20),
        })),
      markAllAsRead: () =>
        set((state) => ({
          items: state.items.map((item) => ({ ...item, read: true })),
        })),
      clearAll: () => set({ items: [] }),
    }),
    { name: 'notifications' }
  )
)
