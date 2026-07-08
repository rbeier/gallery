import { mergeConfig, type UserConfig } from 'vite';

// Force a single instance of @codemirror/state. The admin otherwise pre-bundles
// it into multiple Vite dep chunks, breaking `instanceof` checks and throwing
// "Unrecognized extension value in extension set" when a JSON field renders.
export default (config: UserConfig) => {
  return mergeConfig(config, {
    resolve: {
      dedupe: ['@codemirror/state', '@codemirror/view'],
    },
    optimizeDeps: {
      include: ['@codemirror/state', '@codemirror/view'],
    },
  });
};
