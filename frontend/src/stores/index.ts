import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Initialize MMKV for storage
const storage = new MMKV();

// Custom storage adapter for Zustand
const zustandStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: any) => {
    storage.set(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

// User Store
interface UserState {
  user: {
    id: string;
    email: string;
    name: string;
    profileImage?: string;
  } | null;
  isAuthenticated: boolean;
  setUser: (user: UserState['user']) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      subscribeWithSelector((set) => ({
        user: null,
        isAuthenticated: false,
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        logout: () => set({ user: null, isAuthenticated: false }),
      })),
      {
        name: 'user-storage',
        storage: zustandStorage,
      },
    ),
  ),
);

// Session Store
interface SessionState {
  currentSession: {
    id: string;
    startTime: number;
    shotsDetected: number;
    isRecording: boolean;
  } | null;
  sessions: Array<{
    id: string;
    date: Date;
    shotsCount: number;
    duration: number;
  }>;
  startSession: () => void;
  endSession: () => void;
  incrementShots: () => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      currentSession: null,
      sessions: [],
      startSession: () => {
        const id = Date.now().toString();
        set({
          currentSession: {
            id,
            startTime: Date.now(),
            shotsDetected: 0,
            isRecording: true,
          },
        });
      },
      endSession: () => {
        const { currentSession, sessions } = get();
        if (currentSession) {
          const session = {
            id: currentSession.id,
            date: new Date(currentSession.startTime),
            shotsCount: currentSession.shotsDetected,
            duration: Date.now() - currentSession.startTime,
          };
          set({
            currentSession: null,
            sessions: [...sessions, session],
          });
        }
      },
      incrementShots: () => {
        set((state) => ({
          currentSession: state.currentSession
            ? {
                ...state.currentSession,
                shotsDetected: state.currentSession.shotsDetected + 1,
              }
            : null,
        }));
      },
    })),
  ),
);

// UI Store
interface UIState {
  theme: 'light' | 'dark';
  isLoading: boolean;
  error: string | null;
  setTheme: (theme: UIState['theme']) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'light',
        isLoading: false,
        error: null,
        setTheme: (theme) => set({ theme }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
      }),
      {
        name: 'ui-storage',
        storage: zustandStorage,
      },
    ),
  ),
);
