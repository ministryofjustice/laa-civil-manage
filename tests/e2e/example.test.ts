import { test, expect } from "@playwright/test";

test("homepage has correct title", async ({ page }) => {
  // This uses the baseURL from your config (http://localhost:3000)
  await page.goto("/");

  // Change "My App" to whatever your site's actual <title> is
  await expect(page).toHaveTitle("applications");
});

test("can see the main heading", async ({ page }) => {
  await page.goto("/");

  // This looks for an <h1> tag. Adjust if needed.
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
});
