module.exports = {
  root: true,
  extends: '@react-native-community',
  rules: {
    quotes: [
      'error',
      'single',
      {avoidEscape: true, allowTemplateLiterals: true},
    ],
  },
};
