import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useApp } from '@/contexts/AppContext';

export function useAppColorScheme(): 'light' | 'dark' {
  const systemScheme = useSystemColorScheme();
  const { state } = useApp();

  // Get darkMode setting with fallback
  const darkModeSetting = state?.progress?.settings?.darkMode ?? 'system';

  // Debug: uncomment to verify setting changes
  // console.log('useAppColorScheme - darkModeSetting:', darkModeSetting);

  if (darkModeSetting === 'dark') {
    return 'dark';
  }

  if (darkModeSetting === 'light') {
    return 'light';
  }

  // darkModeSetting === 'system' - use system preference
  return systemScheme ?? 'light';
}
