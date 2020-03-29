/*

This new config aims to maximise the number of errors caught while minimising annoyance of the developer. We delegate
all stylisitic issues to Prettier, with the expectation that people make use of their editor's format on save feature.
We activate only a minimal set of eslint rules, deliberately passing on rules that catch errors that would always be
caught by tests. The only complete ruleset we extend is React's recommended rules. These rules are all about catching
common misunderstanding in how to use React.

If we find other errors slipping into pull requests that could be caught by eslint, we should enable more rules. For
now, however, I think this minimal setup will help us avoid a lot of papercuts to experience of working on this project.

*/

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [],
  plugins: ['@typescript-eslint', 'prettier'],
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    project: './tsconfig.json',
    ecmaFeatures: {
      modules: true,
    },
  },
  rules: {
    // These catch obviously unintentional patterns.
    'no-cond-assign': 'error',
    'no-duplicate-case': 'error',

    // For performance reasons, Promise.all() should almost always be preferred over `await` in a loop. Promise.all()
    // allows all asynchronous tasks to happen concurrently, while `await` in a loop with perform that tasks serially.
    'no-await-in-loop': 'warn',

    // In JavaScript, attempting to `await` a non-Promise value simply returns that value. If your code `await`s a
    // value can never be a Promise, you can safely remove the `await`.
    '@typescript-eslint/await-thenable': 'warn',

    // The `any` type breaks many of the type soundness guarentees that make TypeScript a useful tool. If you have a
    // with a type you cannot determine ahead of time, prefer the `unknown` type, which requires explicit runtime type
    // checks before the value can be used.
    '@typescript-eslint/no-explicit-any': 'warn',

    // All Promises should have their rejections handled. At the very least, log the error to the console.
    '@typescript-eslint/no-floating-promises': 'warn',

    // This just catches code that can be simplified.
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

    // This is supposed to check that everything has been properly formatted with Prettier, but I can't seem to make it
    // check TypeScript files. Working on it.
    'prettier/prettier': 'error',
  },
  ignorePatterns: ['build/', 'node_modules/'],
};
