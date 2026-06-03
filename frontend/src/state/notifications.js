import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useNotifications = create(
  persist(
    (set, get) => ({
      ownerId: null,
      items: [],
      startSession: (userId) => {
        const normalizedUserId = userId ? String(userId) : null
        const currentOwnerId = get().ownerId

        if (currentOwnerId !== normalizedUserId) {
          set({ ownerId: normalizedUserId, items: [] })
        }
      },
      push: (notification) =>
        set((state) => ({
          ownerId: state.ownerId,
          items: [
            {
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              read: false,
              userId: state.ownerId,
              ...notification,
            },
            ...state.items.filter((item) => item.userId === state.ownerId),
          ].slice(0, 20),
        })),
      markAllAsRead: () =>
        set((state) => ({
          items: state.items
            .filter((item) => item.userId === state.ownerId)
            .map((item) => ({ ...item, read: true })),
        })),
      clearAll: () => set({ items: [] }),
      endSession: () => set({ ownerId: null, items: [] }),
    }),
    { name: 'notifications' }
  )
)
