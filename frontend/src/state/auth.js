import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useNotifications } from './notifications.js'

const getUserId = (user) => user?.id || user?._id || null

export const useAuth = create(persist(
    (set, get)=> ({
        user: null, token: null,
        login: (user, token) => {
            const nextUserId = getUserId(user)
            const currentUserId = getUserId(get().user)

            if (currentUserId !== nextUserId) {
                useNotifications.getState().startSession(nextUserId)
            }

            set({ user, token })
        },
        logout: () => {
            useNotifications.getState().endSession()
            set({ user:null, token:null })
        },
        updateSession: (user, token) => {
            set((state) => ({
                user: user ?? state.user,
                token: token ?? state.token,
            }))
        },
    }),
    { name:'auth' } // guarda en localStorage.auth
))
