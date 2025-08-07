import { Boldonse_400Regular } from '@expo-google-fonts/boldonse';
import { Inter_900Black } from '@expo-google-fonts/inter';
import { Stack, Slot, useRootNavigationState } from "expo-router";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useAuth } from '@/helpers/useAuth';
SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const { initiate } = useAuth()
  const [loaded, error] = useFonts({
    Boldonse_400Regular,
    Inter_900Black
  });
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      initiate()
    }
  }, [loaded, error]);

  if (!loaded) {
    return null
  }

  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="auth" options={{ presentation: "modal", headerShown: false, }} />
  </Stack>;
}