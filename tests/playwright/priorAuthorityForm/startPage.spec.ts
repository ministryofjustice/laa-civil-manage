import { test, expect } from "@playwright/test";

test.describe("Start page", () => {
  test("page has correct title", async ({ page }) => {
    await page.goto("/prior-authority-form/start-page");

    await expect(page).toHaveTitle(`Manage Your Civil Application – GOV.UK`);
  });

  test("page has heading with correct content", async ({ page }) => {
    await page.goto("/prior-authority-form/start-page");

    const heading = page.getByRole("heading", {
      name: "Apply for prior authority",
    });

    await expect(heading).toBeVisible();
  });

  test("page has a start button present and redirect to next page", async ({
    page,
  }) => {
    await page.goto("/prior-authority-form/start-page");

    const startButton = page.getByRole("button", {
      name: "Start",
    });

    await expect(startButton).toBeVisible();

    await startButton.click();

    await expect(page).toHaveURL("/prior-authority-form/type-prior-authority");
  });

  test("page has a link taking to the guidelines", async ({ page }) => {
    await page.goto("/prior-authority-form/start-page");

    const guidelineLink = page.getByRole("link", {
      name: "the codified rates and guideline hours.",
    });

    await expect(guidelineLink).toBeVisible();

    const popupPromise = page.waitForEvent("popup");

    await guidelineLink.click();

    const newPage = await popupPromise;

    await newPage.waitForLoadState();

    await expect(newPage).toHaveURL(
      "https://www.gov.uk/guidance/expert-witnesses-in-legal-aid-cases",
    );
  });
});
