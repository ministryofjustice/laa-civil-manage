import { test as setup, expect } from "@playwright/test";

setup("authenticate", async ({ page }) => {
  await page.goto("/auth/login");

  await expect(page).toHaveURL("http://127.0.0.1:3000/applications");

  await page.context().storageState({ path: "playwright/.auth/user.json" });
});
