import { test, expect } from "@playwright/test";
import { patchSessionForPage } from "#tests/playwright/helpers/seedSession.js";

test("silently refreshes the access token when it expires mid-journey", async ({
  page,
}) => {
  await page.goto("/applications");

  await patchSessionForPage(page, { accessToken: "expired-mock-token" });

  await page.goto("/applications/manage/APP-1001");

  await expect(page).toHaveURL(
    "http://127.0.0.1:3000/applications/manage/APP-1001",
  );
});
