module.exports = {
  displayName: 'job-bank',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/job-bank',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // @tn4consulting/* published packages are ESM (dist/index.js "export *")
  // with no "type": "module" in their own package.json, so Jest's default
  // node_modules exclusion can't parse them without this -- previously hit
  // and fixed the same way across every app repo (see mfe-pot-platform's
  // CLAUDE.md, "Monorepo -> per-app repos"). Kept even though this app no
  // longer imports @angular-architects/@softarc/@gcds-core/@jsverse
  // directly, since job-bank-data-access and other libs still might.
  transformIgnorePatterns: [
    'node_modules/(?!\\.pnpm|(@angular-architects|@softarc|@gcds-core|@jsverse|@tn4consulting)/|.*\\.mjs$)',
  ],
};
