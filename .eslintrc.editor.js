module.exports = {
  extends: ['./.eslintrc.js'],
  rules: {
    // Given Prettier's rules are all auto-fixed on save, there's no need to bug the developer about them while they're
    // working. We enable this in the main config file purely for checking in CI.
    'prettier/prettier': 'off',
  },
};
