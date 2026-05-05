import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: 'es2020',
});
