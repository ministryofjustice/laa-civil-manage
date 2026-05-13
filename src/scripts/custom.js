import { MultiFileUpload } from "@ministryofjustice/frontend/moj/components/multi-file-upload/multi-file-upload.mjs";

const $multiFileUpload = document.querySelector(
  '[data-module="moj-multi-file-upload"]',
);

if ($multiFileUpload) {
  new MultiFileUpload($multiFileUpload, {
    uploadUrl: "/ajax-upload-url",
    deleteUrl: "/ajax-delete-url",
  });
}
