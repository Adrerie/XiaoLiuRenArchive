import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "capacitor" ? "./" : "/",
  plugins: [
    react(),
    ...(mode === "capacitor"
      ? [
          legacy({
            targets: ["Chrome >= 61"],
            renderModernChunks: false,
          }),
        ]
      : []),
  ],
  build: {
    target: "es2015"
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"]
  }
}));
