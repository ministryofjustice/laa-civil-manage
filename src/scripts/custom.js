import { MultiFileUpload } from "@ministryofjustice/frontend/moj/components/multi-file-upload/multi-file-upload.mjs";

const $multiFileUpload = document.querySelector(
  '[data-module="moj-multi-file-upload"]',
);

if ($multiFileUpload !== null) {
  const csrfToken = document
    .querySelector('meta[name="_csrf"]')
    ?.getAttribute("content");

  const $list = $multiFileUpload.querySelector(".moj-multi-file-upload__list");
  if ($list !== null) {
    const $header = document.createElement("div");
    $header.className =
      "govuk-summary-list__row moj-multi-file-upload__row moj-multi-file-upload__header-row";
    $header.innerHTML = `
      <div class="govuk-summary-list__value"><strong>File name</strong></div>
      <div class="govuk-summary-list__actions"><strong>Action</strong></div>
    `;
    $list.insertBefore($header, $list.firstChild);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, no-new -- MultiFileUpload is a third-party JS module without TypeScript declarations, instantiated for side effects
  new MultiFileUpload($multiFileUpload, {
    uploadUrl: `/ajax-upload-url?_csrf=${csrfToken}`,
    deleteUrl: `/ajax-delete-url?_csrf=${csrfToken}`,
    hooks: {
      exitHook() {
        document.querySelector(".govuk-error-summary")?.remove();
        document
          .querySelectorAll(".govuk-form-group--error")
          .forEach((group) => {
            group.classList.remove("govuk-form-group--error");
          });
        document.querySelectorAll(".govuk-error-message").forEach((error) => {
          error.remove();
        });
      },
    },
  });
}
