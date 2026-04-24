// import { test, expect } from "@playwright/test";

// test.describe("Prototype Form Validation", () => {
//   // Navigate to the form before each test
//   test.beforeEach(async ({ page }) => {
//     await page.goto("/pa-form/prototype");
//   });

//   test("should display errors when submitting a completely empty form", async ({
//     page,
//   }) => {
//     // Act: Submit the form immediately
//     await page.getByRole("button", { name: "Submit" }).click();

//     // Assert: The Error Summary box appears at the top
//     const errorSummary = page.locator(".govuk-error-summary");
//     await expect(errorSummary).toBeVisible();
//     await expect(errorSummary).toContainText("There is a problem");

//     // Assert: Error summary links contain the correct text
//     await expect(
//       page.getByRole("link", { name: "Enter a first name" }),
//     ).toBeVisible();
//     await expect(
//       page.getByRole("link", { name: "Enter a last name" }),
//     ).toBeVisible();
//     await expect(
//       page.getByRole("link", { name: "Enter a date of birth" }),
//     ).toBeVisible();

//     // Assert: Individual inline field errors are visible
//     await expect(
//       page.locator("#person\\[0\\]\\[first_name\\]-error"),
//     ).toContainText("Enter a first name");
//     await expect(page.locator("#date-of-birth-error")).toContainText(
//       "Enter a date of birth",
//     );
//   });

//   test("should display a specific error when the date of birth is missing a year", async ({
//     page,
//   }) => {
//     // Arrange: Fill out the rest of the form correctly
//     await page.getByLabel("First name").fill("Jane");
//     await page.getByLabel("Last name").fill("Doe");
//     await page.getByLabel("Email address").fill("jane.doe@example.com");

//     // Arrange: Partially fill out the date
//     await page.getByLabel("Day").fill("15");
//     await page.getByLabel("Month").fill("8");
//     // Deliberately leaving 'Year' blank

//     // Act
//     await page.getByRole("button", { name: "Submit" }).click();

//     // Assert: The specific GOV.UK compound date error is shown
//     await expect(
//       page.getByRole("link", { name: "Date of birth must include a year" }),
//     ).toBeVisible();

//     const inlineError = page.locator("#date-of-birth-error");
//     await expect(inlineError).toBeVisible();
//     await expect(inlineError).toContainText(
//       "Date of birth must include a month",
//     );

//     // Assert: The entered values were preserved after the reload
//     await expect(page.getByLabel("First name")).toHaveValue("Jane");
//     await expect(page.getByLabel("Day")).toHaveValue("15");
//   });

//   test("should display an error when the date of birth is in the future", async ({
//     page,
//   }) => {
//     // Arrange
//     await page.getByLabel("First name").fill("John");
//     await page.getByLabel("Last name").fill("Smith");
//     await page.getByLabel("Email address").fill("john.smith@example.com");

//     // Arrange: Fill out a future date
//     await page.getByLabel("Day").fill("1");
//     await page.getByLabel("Month").fill("1");
//     await page.getByLabel("Year").fill("3000");

//     // Act
//     await page.getByRole("button", { name: "Submit" }).click();

//     // Assert
//     await expect(
//       page.getByRole("link", { name: "Date of birth must be in the past" }),
//     ).toBeVisible();
//   });

//   test("should successfully submit the form and redirect to the success page", async ({
//     page,
//   }) => {
//     // Arrange: Fill out everything correctly
//     await page.getByLabel("First name").fill("Sam");
//     await page.getByLabel("Last name").fill("Gamgee");
//     await page.getByLabel("Day").fill("22");
//     await page.getByLabel("Month").fill("9");
//     await page.getByLabel("Year").fill("1980");
//     await page.getByLabel("Email address").fill("sam@shire.com");

//     // Act
//     await page.getByRole("button", { name: "Submit" }).click();

//     // Assert: We should see the success text from the res.send() spike
//     await expect(page.locator("body")).toContainText("Success!");
//     await expect(page.locator("body")).toContainText(
//       "The form passed validation.",
//     );
//   });
// });
