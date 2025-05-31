export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Playback: { videoUri?: string };
};

export type ScreenNames = keyof RootStackParamList; 