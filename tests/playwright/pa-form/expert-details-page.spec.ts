import { test, expect } from "@playwright/test";

test("page has heading with correct content", async ({ page }) => {
  await page.goto("/pa-form/expert-details");

  const heading = page.getByRole("heading", {
    name: "Expert details",
  });

  await expect(heading).toBeVisible();
});
