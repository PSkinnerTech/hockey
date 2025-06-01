module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // worklets-core plugin MUST be first
    ['react-native-worklets-core/plugin'],
    
    // VisionCamera required plugins (legacy names)
    ['@babel/plugin-proposal-optional-chaining'],
    ['@babel/plugin-proposal-nullish-coalescing-operator'],
    
    // reanimated plugin MUST be last
    [
      'react-native-reanimated/plugin',
      {
        processNestedWorklets: true,
        relativeSourceLocation: true,
      }
    ],
  ],
};