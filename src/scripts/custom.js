import { MultiFileUpload } from "@ministryofjustice/frontend/moj/components/multi-file-upload/multi-file-upload.mjs";

const $multiFileUpload = document.querySelector(
  '[data-module="moj-multi-file-upload"]',
);

if ($multiFileUpload !== null) {
  const csrfToken = document
    .querySelector('meta[name="_csrf"]')
    ?.getAttribute("content");

  document.querySelector("#uploaded-files-empty-table")?.remove();

  const $uploadedFilesContainer = $multiFileUpload.querySelector(
    ".moj-multi-file__uploaded-files",
  );
  $uploadedFilesContainer?.classList.remove("moj-hidden");

  const $list = $multiFileUpload.querySelector(".moj-multi-file-upload__list");

  const createEmptyRow = () => {
    const $emptyRow = document.createElement("div");
    $emptyRow.className =
      "govuk-summary-list__row moj-multi-file-upload__row moj-multi-file-upload__empty-row";
    $emptyRow.innerHTML = `
      <div class="govuk-summary-list__value moj-multi-file-upload__message">
        <strong data-empty-uploaded-files="true">No files added</strong>
      </div>
      <div class="govuk-summary-list__actions moj-multi-file-upload__actions"></div>
    `;
    return $emptyRow;
  };

  const updateNoFilesAddedState = () => {
    if ($list === null) {
      return;
    }

    const isEmptyStateRow = (row) =>
      row.classList.contains("moj-multi-file-upload__empty-row") ||
      row.querySelector('[data-empty-uploaded-files="true"]') !== null;

    const rows = Array.from(
      $list.querySelectorAll(".moj-multi-file-upload__row"),
    );
    const realFileRows = rows.filter((row) => {
      const isHeader = row.classList.contains(
        "moj-multi-file-upload__header-row",
      );
      const isEmpty = isEmptyStateRow(row);
      return !isHeader && !isEmpty;
    });
    const existingEmptyRows = rows.filter((row) => isEmptyStateRow(row));

    if (realFileRows.length > 0) {
      existingEmptyRows.forEach((row) => {
        row.remove();
      });
      return;
    }

    if (existingEmptyRows.length === 0) {
      $list.appendChild(createEmptyRow());
    }
  };

  if ($list !== null) {
    const $header = document.createElement("div");
    $header.className =
      "govuk-summary-list__row moj-multi-file-upload__row moj-multi-file-upload__header-row";
    $header.innerHTML = `
      <div class="govuk-summary-list__value"><strong>File name</strong></div>
      <div class="govuk-summary-list__actions"><strong>Action</strong></div>
    `;
    $list.insertBefore($header, $list.firstChild);

    const observer = new MutationObserver(() => {
      updateNoFilesAddedState();
    });
    observer.observe($list, { childList: true, subtree: true });

    updateNoFilesAddedState();
  }

  const uploadUrl =
    $multiFileUpload.getAttribute("data-ajax-upload-url") ?? "/ajax-upload-url";
  const deleteUrl =
    $multiFileUpload.getAttribute("data-ajax-delete-url") ?? "/ajax-delete-url";

  // Resolves the in-flight upload so the queue can advance. Reassigned per file.
  let resolveCurrentUpload = () => {};

  const clearUploadErrors = () => {
    document.querySelector(".govuk-error-summary")?.remove();
    document.querySelectorAll(".govuk-form-group--error").forEach((group) => {
      group.classList.remove("govuk-form-group--error");
    });
    document.querySelectorAll(".govuk-error-message").forEach((error) => {
      error.remove();
    });
  };

  const multiFileUpload = new MultiFileUpload($multiFileUpload, {
    uploadUrl: `${uploadUrl}?_csrf=${csrfToken}`,
    deleteUrl: `${deleteUrl}?_csrf=${csrfToken}`,
    hooks: {
      exitHook() {
        clearUploadErrors();
        resolveCurrentUpload();
      },
      errorHook() {
        resolveCurrentUpload();
      },
    },
  });

  // The MOJ component uploads every selected file in parallel. Each upload
  // mutates the same session document via a read-modify-write, so concurrent
  // requests race and only the last write survives (files "disappear" on
  // refresh). Upload one file at a time so the session writes are serialised.
  const uploadSingleFile = multiFileUpload.uploadFile.bind(multiFileUpload);
  multiFileUpload.uploadFiles = async (files) => {
    for (const file of Array.from(files)) {
      await new Promise((resolve) => {
        resolveCurrentUpload = resolve;
        uploadSingleFile(file);
      });
      resolveCurrentUpload = () => {};
    }
  };
}
