import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      outDir: ["./dist"],
      rollupTypes: true,
    }),
  ],
  esbuild: {
    drop: ['debugger'],
    legalComments: 'none',
    minifyIdentifiers: true,
    target: 'es2020',
    minifySyntax: true,
    minifyWhitespace: true,
  },
  build: {
    target: "es2020",
    outDir: "./dist",
    minify: "esbuild",
    sourcemap: false,
    lib: {
      entry: "./src/index.ts",
      name: "MapOrbisCore",
      fileName: "index",
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ["three"],
      output: {
        globals: {
          three: "THREE",
        },
      },
    },
  },
});
