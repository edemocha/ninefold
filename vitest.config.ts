import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/*/test/**/*.test.ts',
      'tools/*/test/**/*.test.ts',
      'apps/*/test/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
    testTimeout: 30_000,
    // A few tests assert wall-clock speed (a year of day cards in under 50 ms). Leave half the logical cores free
    // so heavy files running beside them, like the flip-rate sweeps, do not starve them on a laptop.
    maxWorkers: '50%',
  },
});
