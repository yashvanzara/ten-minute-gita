import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { initSentry } from '@/utils/sentry';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

initSentry();
import { AppProvider } from '@/contexts/AppContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { FTUEProvider } from '@/contexts/FTUEContext';
import { AppErrorBoundary } from '@/components/ErrorBoundary';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import Colors from '@/constants/Colors';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <LanguageProvider>
        <FTUEProvider>
          <AppProvider>
            <AudioPlayerProvider>
              <RootLayoutNav />
            </AudioPlayerProvider>
          </AppProvider>
        </FTUEProvider>
      </LanguageProvider>
    </AppErrorBoundary>
  );
}

function RootLayoutNav() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const customDarkTheme = {
    ...DarkTheme,
    dark: true,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      primary: colors.accent,
      border: colors.border,
      notification: colors.accent,
    },
  };

  const customLightTheme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      primary: colors.accent,
      border: colors.border,
      notification: colors.accent,
    },
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="completed-readings"
          options={{
            headerShown: true,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="reading/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerBackVisible: false,
            animation: 'none',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
