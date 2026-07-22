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

  test("page has a text area for justification and the system can accept a value", async ({
    page,
  }) => {
    await page
      .locator("#justification")
      .fill("This counsel is necessary to support the case.");
    await expect(
      page.getByRole("button", { name: "Save and continue" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Save and continue" }).click();
    await expect(page).toHaveURL(
      "/prior-authority-form/counsel/document-upload",
    );
  });
});
