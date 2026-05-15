import { MultiFileUpload } from "@ministryofjustice/frontend/moj/components/multi-file-upload/multi-file-upload.mjs";

const $multiFileUpload = document.querySelector(
  '[data-module="moj-multi-file-upload"]',
);

if ($multiFileUpload !== null) {
  const csrfToken = document
    .querySelector('meta[name="_csrf"]')
    ?.getAttribute("content");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, no-new -- MultiFileUpload is a third-party JS module without TypeScript declarations, instantiated for side effects
  new MultiFileUpload($multiFileUpload, {
    uploadUrl: `/ajax-upload-url?_csrf=${csrfToken}`,
    deleteUrl: `/ajax-delete-url?_csrf=${csrfToken}`,
  });
}
