import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The build must produce ONE self-contained dist/index.html that works when
// opened via file:// with no network access. Never add fetch(), dynamic
// import(), or external asset URLs to the app.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2019',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
