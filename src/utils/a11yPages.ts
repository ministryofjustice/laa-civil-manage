import { documentUploadA11yPages } from "#src/routes/document-upload.router.js";
import { paFormA11yPages } from "#src/routes/pa-form.router.js";

export const a11yPages = [
  ...new Set([...paFormA11yPages, ...documentUploadA11yPages]),
].sort();
