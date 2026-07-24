import { test, expect } from "@playwright/test";

test.describe("Expert page", () => {
  test("page has correct title", async ({ page }) => {
    await page.goto("/prior-authority/expert");

    await expect(page).toHaveTitle(`Manage Your Civil Application – GOV.UK`);
  });

  test("page has heading with correct content", async ({ page }) => {
    await page.goto("/prior-authority/expert");
    const caption = page.locator(".govuk-caption-xl", {
      hasText: "Prior authority",
    });
    const heading = page.getByRole("heading", {
      name: "Apply for an expert",
    });

    await expect(caption).toBeVisible();
    await expect(heading).toBeVisible();
  });

  test("page has a start button present and redirect to next page", async ({
    page,
  }) => {
    await page.goto("/prior-authority/expert");

    const startButton = page.getByRole("button", {
      name: "Start",
    });

    await expect(startButton).toBeVisible();

    await startButton.click();

    await expect(page).toHaveURL(
      "/prior-authority/expert/is-guideline-rate-exceeded",
    );
  });

  test("page has a back link taking to the previous page", async ({ page }) => {
    await page.goto("/prior-authority/expert");

    const backLink = page.getByRole("link", { name: "Back", exact: true });

    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/prior-authority/prior-authority-type");
  });
});
