import { defineConfig } from 'vite';
import { copyFileSync } from 'node:fs';
export default defineConfig({
  plugins: [{ name: 'three-license', closeBundle() { copyFileSync('node_modules/three/LICENSE', '../../assets/travelling/THREE-LICENSE.txt'); } }],
  build: {
    outDir: '../../assets/travelling',
    emptyOutDir: true,
    lib: { entry: 'src/main.js', formats: ['es'], fileName: () => 'travelling.js' },
    sourcemap: false,
  },
});
