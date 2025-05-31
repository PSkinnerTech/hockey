import { NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

export type RootStackParamList = {
  Home: undefined;
  Recording:
    | {
        sessionId?: string;
      }
    | undefined;
  Analysis: {
    shotId: string;
    videoUri: string;
  };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>;

// Type helpers for navigation
export type NavigationProp = RootStackScreenProps<keyof RootStackParamList>['navigation'];
export type RouteProp<T extends keyof RootStackParamList> = RootStackScreenProps<T>['route'];

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
