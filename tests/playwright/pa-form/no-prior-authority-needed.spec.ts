import { test, expect } from "@playwright/test";

test.describe("No prior authority needed page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pa-form/no-prior-authority-needed");
  });

  test("page has correct title", async ({ page }) => {
    await expect(page).toHaveTitle(`Manage Your Civil Application – GOV.UK`);
  });

  test("page has heading with correct content", async ({ page }) => {
    const heading = page.getByRole("heading", {
      name: "You do not need to apply for prior authority",
    });

    await expect(heading).toBeVisible();
  });

  test("page has body text explaining why prior authority is not needed", async ({
    page,
  }) => {
    await expect(
      page.getByText(
        "This is because the expert you're instructing is working at or below the codified rate and within the guideline hours.",
      ),
    ).toBeVisible();

    await expect(
      page.getByText("You can justify these costs on assessment."),
    ).toBeVisible();
  });

  test("primary button 'Back to your applications' stays on the current page", async ({
    page,
  }) => {
    const backToApplicationsButton = page.getByRole("button", {
      name: "Back to your applications",
    });

    await expect(backToApplicationsButton).toBeVisible();

    await backToApplicationsButton.click();

    await expect(page).toHaveURL("/pa-form/no-prior-authority-needed#");
  });

  test("secondary link 'Continue applying for prior authority' routes to search-an-expert-type", async ({
    page,
  }) => {
    const continueLink = page.getByRole("link", {
      name: "Continue applying for prior authority",
    });

    await expect(continueLink).toBeVisible();

    await continueLink.click();

    await expect(page).toHaveURL("/pa-form/search-an-expert-type");
  });

  test("back link routes to is-guideline-rate-exceeded", async ({ page }) => {
    const backLink = page.getByRole("link", {
      name: "Back",
    });

    await expect(backLink).toBeVisible();

    await backLink.click();

    await expect(page).toHaveURL("/pa-form/is-guideline-rate-exceeded");
  });
});
