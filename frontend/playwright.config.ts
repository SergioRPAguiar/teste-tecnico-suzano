import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: process.env.E2E_MODE === "real" ? "real.spec.ts" : "catalog.spec.ts",
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000", locale: "pt-BR",
    colorScheme: "light", reducedMotion: "reduce", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } }],
  webServer: process.env.E2E_BASE_URL ? undefined : { command: "npm run start", url: "http://127.0.0.1:3000", reuseExistingServer: false, timeout: 120000 },
});
