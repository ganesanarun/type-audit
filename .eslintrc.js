module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
    ],
    rules: {
        '@typescript-eslint/no-unused-vars': ['error', {'argsIgnorePattern': '^_'}],
        'no-unused-vars': ['error', {'argsIgnorePattern': '^_'}],
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-var': 'error',
        'no-console': 'warn',
        'eqeqeq': 'error',
        'curly': 'error',
    },
    env: {
        node: true,
        es6: true,
        jest: true,
    },
    ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};