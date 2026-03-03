import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, existsSync } from 'fs';

// 自动扫描所有示例目录
const examplesDir = resolve(__dirname, 'src');
let examples: string[] = [];

if (existsSync(examplesDir)) {
  examples = readdirSync(examplesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

// 构建多页面入口
const input: Record<string, string> = {
  main: resolve(__dirname, 'index.html'),
  ...Object.fromEntries(
    examples.map(name => [name, resolve(__dirname, `src/${name}/index.html`)])
  )
};

export default defineConfig({
  root: __dirname,
  base: './',
  publicDir: resolve(__dirname, '../shared'),
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared'),
      '@maporbis/core': resolve(__dirname, '../../packages/maporbis-core/src/index.ts')
    }
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: ['..', '../..']
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input
    }
  }
});
