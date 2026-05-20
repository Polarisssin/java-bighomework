import { defineConfig, loadEnv } from "vite";

import vue from "@vitejs/plugin-vue";

import react from "@vitejs/plugin-react";

import path from "path";



function normalizeBase(p: string) {

  if (!p.startsWith("/")) return `/${p}`;

  return p.endsWith("/") ? p : `${p}/`;

}



export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), "");

  const prodBase = normalizeBase(env.VITE_BASE_PATH || "/neusoft/v1/");

  return {

    base: mode === "production" ? prodBase : "/",

    plugins: [vue(), react({ include: /\.(jsx|tsx)$/ })],

    resolve: {

      alias: { "@": path.resolve(__dirname, "./src") },

    },

    define: {

      __MODEL_ASSET_V__: JSON.stringify(String(Math.floor(Date.now() / 1000))),

    },

    build: {
      // 构建后由 scripts/ascii-dist.mjs 将 JS 中非 ASCII 转为 \\u 转义，避免托管上传中文变问号
    },

    server: {

      port: 5173,

      proxy: {

        "/api": {

          target: env.VITE_API_PROXY || "http://127.0.0.1:8080",

          changeOrigin: true,

        },

      },

    },

  };

});


