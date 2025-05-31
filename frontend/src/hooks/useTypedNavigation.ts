import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';
import type { NavigationProp, RootStackParamList, RouteProp } from '../types/navigation';

/**
 * Type-safe navigation hook
 */
export const useTypedNavigation = () => {
  return useNavigation<NavigationProp>();
};

/**
 * Type-safe route hook
 */
export const useTypedRoute = <T extends keyof RootStackParamList>() => {
  return useRoute<RouteProp<T>>();
};

/**
 * Custom back handler for specific screens
 */
export const useCustomBackHandler = (
  condition: boolean,
  onBackPress: () => boolean | undefined | null,
) => {
  const handleBackPress = useCallback(() => {
    if (condition) {
      return onBackPress() || false;
    }
    return false;
  }, [condition, onBackPress]);

  // Register back handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [handleBackPress]);
};

/**
 * Navigation helpers with type safety
 */
export const useNavigationHelpers = () => {
  const navigation = useTypedNavigation();

  const navigateToHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  const navigateToRecording = useCallback(
    (sessionId?: string) => {
      navigation.navigate('Recording', sessionId ? { sessionId } : undefined);
    },
    [navigation],
  );

  const navigateToAnalysis = useCallback(
    (shotId: string, videoUri: string) => {
      navigation.navigate('Analysis', { shotId, videoUri });
    },
    [navigation],
  );

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  }, [navigation]);

  const resetToHome = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  }, [navigation]);

  return {
    navigateToHome,
    navigateToRecording,
    navigateToAnalysis,
    goBack,
    resetToHome,
  };
};
