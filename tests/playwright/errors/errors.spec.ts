import { test, expect } from "@playwright/test";

test.describe("404 Page Not Found Tests", () => {
  test("not found page loads when going to a non existant route", async ({
    page,
  }) => {
    await page.goto("/bananas");

    await expect(page).toHaveTitle(
      `Page not found – Manage Your Civil Application – GOV.UK`,
    );
  });

  test("page has heading with correct content", async ({ page }) => {
    await page.goto("/bananas");

    const heading = page.getByRole("heading", {
      name: "Page not found",
    });

    await expect(heading).toBeVisible();
  });
});

test.describe("500 Internal Server Error Tests", () => {
  test("Internal server error page loads when and error is caught", async ({
    page,
  }) => {
    await page.goto("/error");

    await expect(page).toHaveTitle(
      `Sorry, there is a problem with the service – Manage Your Civil Application – GOV.UK`,
    );
  });

  test("page has heading with correct content", async ({ page }) => {
    await page.goto("/error");

    const heading = page.getByRole("heading", {
      name: "Sorry, there is a problem with the service",
    });

    await expect(heading).toBeVisible();
  });
});
