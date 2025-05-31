import React from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { useColorScheme } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { Colors, getThemeColors } from '../theme/colors';
import { Layout, Typography } from '../theme/spacing';

// Import screens (to be created)
import HomeScreen from '../screens/HomeScreen';
import RecordingScreen from '../screens/RecordingScreen';
import AnalysisScreen from '../screens/AnalysisScreen';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');

  const screenOptions: StackNavigationOptions = {
    headerStyle: {
      backgroundColor: colors.background.primary,
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    headerTintColor: colors.text.primary,
    headerTitleStyle: {
      fontWeight: Typography.fontWeight.semibold,
      fontSize: Typography.fontSize.lg,
    },
    headerBackTitle: '',
    cardStyle: {
      backgroundColor: colors.background.primary,
    },
    // Smooth transitions
    gestureEnabled: true,
  };

  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Smart Hockey Coach',
          headerShown: false, // Custom header in HomeScreen
        }}
      />

      <Stack.Screen
        name="Recording"
        component={RecordingScreen}
        options={{
          title: 'Record Shot',
          headerShown: false, // Full screen camera
          gestureEnabled: false, // Prevent accidental swipe back during recording
        }}
      />

      <Stack.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          title: 'Shot Analysis',
          presentation: 'modal', // Modal presentation for analysis
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};
