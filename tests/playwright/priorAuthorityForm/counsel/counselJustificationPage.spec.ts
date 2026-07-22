import { test, expect } from "@playwright/test";

test.describe("Justification page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prior-authority-form/counsel/justification");
  });

  test("page has the correct heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        name: "Why is this application necessary?",
      }),
    ).toBeVisible();
  });

  test("header has the correct hint text", async ({ page }) => {
    await expect(
      page.getByText(
        "Provide a background to the case that demonstrates relevant circumstances and explanation of the specific expertise required.",
      ),
    ).toBeVisible();
  });
});
