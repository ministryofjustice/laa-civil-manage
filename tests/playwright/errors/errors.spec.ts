import { test, expect } from "@playwright/test";

test("not found page loads when going to a non existant route", async ({
  page,
}) => {
  await page.goto("/bananas");

  await expect(page).toHaveTitle(
    `Sorry, there is a problem with the service – Civil Manage – GOV.UK`,
  );
});

test("page has heading with correct content", async ({ page }) => {
  await page.goto("/bananas");

  const heading = page.getByRole("heading", {
    name: "Page not found",
  });

  await expect(heading).toBeVisible();
});
