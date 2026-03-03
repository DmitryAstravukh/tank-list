/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: "chrome73",
    cssTarget: "chrome73",
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@/style/_reset.scss";
          @use "@/style/_fonts.scss";
          @use "@/style/_mixins.scss" as m;
          @use "@/style/_variables.scss" as *;
          @use "@/style/_global.scss";
        `,
      },
    },
  },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.unit.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "jsdom",
          include: ["src/**/*.component.test.tsx"],
          setupFiles: ["./setup.ts"], // jest-dom только тут
        },
      },
    ],
  },
});
