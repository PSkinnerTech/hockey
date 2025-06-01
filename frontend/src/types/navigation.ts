export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Playback: { videoUri?: string };
  VideoLibrary: undefined;
};

export type ScreenNames = keyof RootStackParamList; 