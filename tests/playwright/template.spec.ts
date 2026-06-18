import { AxeBuilder } from "@axe-core/playwright";
import type { NodeResult, Result } from "axe-core";
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

    const filteredViolations = accessibilityScanResults.violations.filter(
      (violation: Result) => {
        // Ignores a known issue with govuk-frontend radios and conditional content discussed here: https://github.com/alphagov/govuk-frontend/issues/979
        if (violation.id === "aria-allowed-attr") {
          violation.nodes = violation.nodes.filter((node: NodeResult) => {
            const isGovUkRadio = node.html.includes("govuk-radios__input");
            return !isGovUkRadio;
          });

          return violation.nodes.length > 0;
        }

        return true;
      },
    );

    expect(filteredViolations).toEqual([]);
  }
});

test("Should send CSP header with request nonce and allow nonce-backed inline scripts", async ({
  page,
}) => {
  const firstResponse = await page.goto("/");
  const firstNonce = await page
    .locator("script[nonce]")
    .first()
    .evaluate((script) => script.nonce);
  const firstCsp = firstResponse?.headers()["content-security-policy"];

  expect(firstResponse).not.toBeNull();
  expect(firstCsp).toBeTruthy();
  expect(firstNonce).toBeTruthy();
  expect(firstCsp).toContain("script-src");
  expect(firstCsp).toContain(`'nonce-${firstNonce}'`);
  await expect(page.locator("body")).toHaveClass(/js-enabled/);

  const secondResponse = await page.goto("/");
  const secondNonce = await page
    .locator("script[nonce]")
    .first()
    .evaluate((script) => script.nonce);
  const secondCsp = secondResponse?.headers()["content-security-policy"];

  expect(secondNonce).toBeTruthy();
  expect(secondCsp).toBeTruthy();
  expect(secondCsp).toContain(`'nonce-${secondNonce}'`);
  expect(secondNonce).not.toEqual(firstNonce);
});
