import { useCallback, useEffect } from 'react';
import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

type Auth = {
    jwt: string,
    user: {
        id?: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
    }
}

interface AuthStore {
    isReady: boolean;
    auth: Auth | null;
    setAuth: (auth: Auth | null) => void;
}

const authKey = `${process.env.EXPO_PUBLIC_PROJECT_ID}-jwt-13`

export const useAuthStore = create<AuthStore>((set) => ({
    isReady: false,
    auth: null,
    setAuth: (auth) => {
        if (auth) {
            SecureStore.setItemAsync(authKey, JSON.stringify(auth))
        } else {
            SecureStore.deleteItemAsync(authKey)
        }
        set({ auth })
    },
}))

export const useUser = () => {
    const { auth, isReady } = useAuth();
    const user = auth?.user || null
    const fetchUser = useCallback(async () => {
        return user
    }, [user]);
    return { user, data: user, loading: !isReady, refetch: fetchUser };
}

export const useAuth = () => {
    const { auth, setAuth, isReady } = useAuthStore()

    const initiate = useCallback(() => {
        SecureStore.getItemAsync(authKey).then(auth => {
            useAuthStore.setState({ auth: auth ? JSON.parse(auth) : null, isReady: true })
        })
    }, [])

    useEffect(() => {
    }, [])

    const signIn = useCallback(({ preventBack = false }: { preventBack?: boolean } = {}) => {
        router.push({ pathname: '/auth', params: { preventBack: JSON.stringify(preventBack) } })
    }, [])

    const signOut = useCallback(() => {
        setAuth(null)
    }, [])

    return { isReady, isAuthenticated: isReady ? !!auth : null, signIn, signOut, signUp: signIn, auth, setAuth, initiate }
}