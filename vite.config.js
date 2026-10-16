import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // three.js lives in the lazily loaded seascape chunk (~550 kB, ~140 kB gzip): the page renders before it arrives.
    chunkSizeWarningLimit: 650,
  },
});
