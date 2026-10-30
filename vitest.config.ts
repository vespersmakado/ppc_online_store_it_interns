import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    includeSource: [
      "src/pages/home/HomePage.tsx",
      "src/pages/buy/BuyPage.tsx",
      "src/pages/login/LoginPage.tsx",
      "src/pages/new-user/NewUserPage.tsx",
      "src/pages/view-order/ViewOrderPage.tsx",
      "src/pages/view-order/quotation-data.ts",
      "src/pages/view-order/conditions.ts",
      "src/router.tsx",
    ],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
