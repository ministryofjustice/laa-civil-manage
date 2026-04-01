import { test, expect } from "@playwright/test";

test("page has correct title", async ({ page }) => {
  await page.goto("/pa-form/type-pa");

  await expect(page).toHaveTitle(`Civil Manage – GOV.UK`);
});

test("page has heading with correct content", async ({ page }) => {
  await page.goto("/pa-form/type-pa");

  const heading = page.getByRole("heading", {
    name: "What type of prior authority are you applying for?",
  });

  await expect(heading).toBeVisible();
});

test("page has radio options with correct content", async ({ page }) => {
  await page.goto("/pa-form/type-pa");

  const radioOption1 = page.getByRole("radio", {
    name: "Expert",
  });

  const radioOption2 = page.getByRole("radio", {
    name: "Expense",
  });

  const radioOption3 = page.getByRole("radio", {
    name: "Counsel",
  });

  await expect(radioOption1).toBeVisible();
  await expect(radioOption2).toBeVisible();
  await expect(radioOption3).toBeVisible();
});

test("page has a save and continue button present and functional", async ({ page }) => {
  await page.goto("/pa-form/type-pa");

  const saveAndContinueButton = page.getByRole("button", {
    name: "Save and continue",
  });

  await expect(saveAndContinueButton).toBeVisible();

  await saveAndContinueButton.click();

  await expect(page).toHaveURL("/pa-form/expert");
});

test("page has a save and continue button present", async ({ page }) => {
  await page.goto("/pa-form/type-pa");

  const saveAndComeBackLaterButton = page.getByRole("button", {
    name: "Save and come back later",
  });

  await expect(saveAndComeBackLaterButton).toBeVisible();
});

test("page has a back link taking to the previous page", async ({ page }) => {
  await page.goto("/pa-form/type-pa");

  const backLink = page.getByRole("link", {
    name: "Back",
  });

  await expect(backLink).toBeVisible();

  await backLink.click();

  await expect(page).toHaveURL("/pa-form/start-page");
});
