import { test as setup, expect } from "@playwright/test";

setup("authenticate", async ({ page }) => {
  await page.goto("/auth/login");

  await expect(page).toHaveURL("http://localhost:3000/applications");

  await page.context().storageState({ path: "playwright/.auth/user.json" });
});
