import AxeBuilder from "@axe-core/playwright";
import { pages } from "#src/constants.js";
import { test, expect } from "@playwright/test";

test("Do pages show a header", async ({ page }) => {
  for (const singlePage of pages) {
    await page.goto(singlePage);
    const header = page.getByRole("banner");
    const departmentName = header.getByRole("link", {
      name: "Legal aid agency",
    });

    await expect(header).toBeVisible();
    await expect(departmentName).toBeVisible();
  }
});

test("Do pages show a service navigation component", async ({ page }) => {
  for (const singlePage of pages) {
    await page.goto(singlePage);
    const serviceNavigation = page.locator(".govuk-service-navigation");
    const departmentName = serviceNavigation.getByRole("link", {
      name: "Apply for civil legal aid",
    });

    await expect(serviceNavigation).toBeVisible();
    await expect(departmentName).toBeVisible();
  }
});

test("Do pages show a service phase component with a feedback link", async ({
  page,
}) => {
  for (const singlePage of pages) {
    await page.goto(singlePage);
    const servicePhase = page.locator(".govuk-phase-banner");
    const feedbackLink = servicePhase.getByRole("link", {
      name: "feedback",
    });

    await expect(servicePhase).toBeVisible();
    await expect(feedbackLink).toBeVisible();
  }
});

test("Do pages show a footer with correct department name", async ({
  page,
}) => {
  for (const singlePage of pages) {
    await page.goto(singlePage);

    const footer = page.locator(".govuk-template__footer");
    const footerLink = footer.getByRole("link", { name: "Legal Aid Agency" });

    await expect(footer).toBeVisible();
    await expect(footerLink).toBeVisible();
  }
});

test("Should not have any automatically detectable WCAG A or AA violations", async ({
  page,
}) => {
  for (const singlePage of pages) {
    await page.goto(singlePage);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
        "wcag22a",
        "wcag22aa",
      ])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  }
});
