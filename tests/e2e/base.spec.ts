// import { test, expect } from "@playwright/test";

//   test.describe("Page header", () => {
//     test("should contain organisation name and link to organisation page", async ({
//       page,
//     }) => {
//       await page.goto("/applications");
//       const headers = page.getByRole("banner");
//       const mojHeader = headers
//         .filter({ hasText: "Legal Aid Agency" })
//         .getByRole("banner");
//       await expect(mojHeader).toBeVisible();
//       await expect(
//         mojHeader.getByRole("link", { name: "Legal Aid Agency" }),
//       ).toHaveAttribute(
//         "href",
//         "https://www.gov.uk/government/organisations/legal-aid-agency",
//       );
//     });

//     test("should contain a service description and link to the service page", async ({
//       page,
//     }) => {
//       await page.goto("/applications");
//       await expect(
//         page.getByRole("link", {
//           name: "Decide if an applicant can get legal aid",
//         }),
//       ).toHaveAttribute("href", "/");
//     });

//     test("should contain navigation component", async ({ page }) => {
//       await page.goto("/applications");
//       const header = page.getByRole("banner");
//       const nav = header.getByRole("navigation", { name: "Menu" });
//       await expect(nav).toBeVisible();
//     });

//     test("contains correct text in beta banner", async ({ page }) => {
//       await page.goto("/applications");
//       await expect(page.getByText("Beta")).toBeVisible();
//       await expect(
//         page.getByText(
//           "This is a new service – your feedback will help us to improve it.",
//         ),
//       ).toBeVisible();
//     });

//     test.describe("Navigation", () => {
//       test("shows navigation tabs", async ({ page }) => {
//         await page.goto("/applications");
//         const nav = page.getByLabel("Menu");
//         const defaultTab = nav.getByRole("listitem").first();
//         await expect(defaultTab).toHaveText("Open applications");
//         const secondTab = nav.getByRole("listitem").nth(1);
//         await expect(secondTab).toHaveText("Your list");
//         const thirdTab = nav.getByRole("listitem").nth(2);
//         await expect(thirdTab).toHaveText("Search");
//       });

//       test("Open application tab directs to Open applications page", async ({
//         page,
//       }) => {
//         await page.goto("/applications");
//         const nav = page.getByLabel("Menu");
//         const openApplicationsLink = nav.getByRole("listitem").first();
//         await openApplicationsLink.click();
//         await expect(page).toHaveURL("/applications");
//       });

//       test("Your list tab directs to Your list page", async ({ page }) => {
//         await page.goto("/applications");
//         const nav = page.getByLabel("Menu");
//         const yourListLink = nav.getByRole("listitem").nth(1);
//         await yourListLink.click();
//         await expect(page).toHaveURL("/applications/your-list");
//       });

//       test("Search tab directs to Search page", async ({ page }) => {
//         await page.goto("/applications");
//         const nav = page.getByLabel("Menu");
//         const searchLink = nav.getByRole("listitem").nth(2);
//         await searchLink.click();
//         await expect(page).toHaveURL("/search");
//       });
//     });

//     test.describe("Page footer", () => {
//       test("should contain department name and link to department page", async ({
//         page,
//       }) => {
//         await page.goto("/applications");
//         const footer = page.getByRole("contentinfo");
//         await expect(
//           footer.getByRole("link", { name: "Legal Aid Agency" }),
//         ).toHaveAttribute(
//           "href",
//           "https://www.gov.uk/government/organisations/legal-aid-agency",
//         );
//       });
//       test("links directly to correct pages", async ({ page }) => {
//         await page.goto("/applications");
//         const footer = page.getByRole("contentinfo");
//         await expect(
//           footer.getByRole("link", { name: "Cookies" }),
//         ).toHaveAttribute("href", "https://www.gov.uk/help/cookies");
//         await expect(
//           footer.getByRole("link", { name: "Accessibility statement" }),
//         ).toHaveAttribute(
//           "href",
//           "https://www.gov.uk/help/accessibility-statement",
//         );
//         await expect(
//           footer.getByRole("link", { name: "Privacy" }),
//         ).toHaveAttribute("href", "https://www.gov.uk/help/privacy-notice");
//       });
//     });
//     test.describe("Error messages", () => {
//       test("displays 404 error message when application list returns 404", async ({
//         page,
//       }) => {
//         await page.goto("/route");
//         const errorHeading = page.getByText(
//           "Sorry, there is a problem with the service",
//         );
//         await expect(errorHeading).toBeVisible();
//         await expect(page.getByText("404 Page not Found")).toBeVisible();
//       });
//     });
//   });
// });
