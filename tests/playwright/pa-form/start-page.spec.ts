import { test, expect } from "@playwright/test";

test("page has correct title", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(`Civil Manage – GOV.UK`);
});

test("page has heading with correct content", async ({ page }) => {
  await page.goto("/");

  const heading = page.getByRole("heading", {
    name: "Apply for prior authority",
  });

  await expect(heading).toBeVisible();
});

test("page has a start button present and redirect to next page", async ({
  page,
}) => {
  await page.goto("/");

  const startButton = page.getByRole("button", {
    name: "Start",
  });

  await expect(startButton).toBeVisible();

  await startButton.click();

  await expect(page).toHaveURL("/type-pa");
});

test("page has a link taking to the guidelines", async ({ page }) => {
  await page.goto("/");

  const guidelineLink = page.getByRole("link", {
    name: "the codified rates and guideline hours (opens in new tab).",
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
