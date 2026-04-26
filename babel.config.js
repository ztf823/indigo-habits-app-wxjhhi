
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { unstable_transformImportMeta: true }]
    ],
    // react-native-reanimated/plugin must be the LAST plugin (Reanimated v3 requirement)
    plugins: [
      "react-native-reanimated/plugin"
    ]
  };
};
