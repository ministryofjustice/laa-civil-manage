/* eslint-disable no-console -- Unable to use Logger at this point */
import { builtinModules } from "node:module";
import * as sass from "sass";
import fs from "fs-extra";
import path from "node:path";
import chokidar from "chokidar";
import { getBuildNumber } from "./src/utils/buildHelper.js";

// Load environment variables implicitly via Bun (Bun reads .env automatically!)
const buildNumber = getBuildNumber();
const NO_MORE_ASYNC_OPERATIONS = 0;
const UNCAUGHT_FATAL_EXCEPTION = 1;

const externalModules: string[] = [
  ...builtinModules,
  "express",
  "nunjucks",
  "dotenv",
  "cookie-signature",
  "cookie-parser",
  "express-session",
  "axios",
  "middleware-axios",
  "util",
  "path",
  "fs",
  "redis",
  "@redis/client",
  "connect-redis",
  "*.node",
];

const copyAssets = async (): Promise<void> => {
  try {
    await fs.copy(
      path.resolve("./node_modules/govuk-frontend/dist/govuk/assets"),
      path.resolve("./public/assets"),
    );
    await fs.copy(
      path.resolve(
        "./node_modules/@ministryofjustice/frontend/moj/assets/images",
      ),
      path.resolve("./public/assets/images"),
    );
    console.log("✅ GOV.UK & MOJ assets copied successfully.");
  } catch (error) {
    console.error("❌ Failed to copy assets:", error);
    process.exit(UNCAUGHT_FATAL_EXCEPTION);
  }
};

const buildScss = async (): Promise<void> => {
  try {
    const result = sass.compile("src/scss/main.scss", {
      loadPaths: [path.resolve("."), path.resolve("node_modules")],
      style: process.env.NODE_ENV === "production" ? "compressed" : "expanded",
      sourceMap: process.env.NODE_ENV !== "production",
      quietDeps: true,
    });

    // Apply your custom regex transforms
    const transformedCss = result.css
      .replace(
        /url\(["']?\/assets\/fonts\/(?<font>[^"'\)]+)["']?\)/gv,
        'url("/assets/fonts/$<font>")',
      )
      .replace(
        /url\(["']?\/assets\/images\/(?<image>[^"'\)]+)["']?\)/gv,
        'url("/assets/images/$<image>")',
      );

    await Bun.write(`public/css/main.${buildNumber}.css`, transformedCss);
    console.log("✅ SCSS compiled successfully.");
  } catch (error) {
    console.error("❌ SCSS build failed:", error);
  }
};

const buildAppJs = async (): Promise<void> => {
  const result = await Bun.build({
    entrypoints: ["src/index.ts"],
    target: "node",
    format: "esm",
    sourcemap: process.env.NODE_ENV === "production" ? "none" : "external",
    minify: process.env.NODE_ENV === "production",
    external: externalModules,
    outdir: "public",
    naming: "index.js", // Explicitly name the output
  });

  if (result.success) {
    console.log("✅ index.js compiled successfully.");
  } else {
    console.error("❌ index.js build failed:");
    console.error(result.logs);
  }
};

// const buildCustomJs = async (): Promise<void> => {
//   const result = await Bun.build({
//     entrypoints: ["src/js/main.js"],
//     target: "browser",
//     format: "esm",
//     sourcemap: process.env.NODE_ENV !== "production" ? "external" : "none",
//     minify: process.env.NODE_ENV === "production",
//     outdir: "public/js",
//     naming: `custom.${buildNumber}.min.js`,
//   });

//   if (!result.success) console.error("❌ custom.js build failed:", result.logs);
// };

const buildFrontendPackages = async (): Promise<void> => {
  const result = await Bun.build({
    entrypoints: ["src/scripts/frontendPackagesEntry.ts"],
    target: "browser",
    format: "esm",
    sourcemap: process.env.NODE_ENV === "production" ? "none" : "external",
    minify: process.env.NODE_ENV === "production",
    outdir: "public/js",
    naming: `frontend-packages.${buildNumber}.min.js`,
  });

  if (!result.success) {
    console.error("❌ Frontend packages JS build failed:", result.logs);
  }
};

const watchBuild = async (): Promise<void> => {
  try {
    // Initial Build
    await copyAssets();
    await Promise.all([
      buildScss(),
      buildAppJs(),
      // buildCustomJs(),
      buildFrontendPackages(),
    ]);

    const watcher = chokidar.watch(
      [
        "src/**/*",
        "node_modules/govuk-frontend/dist/govuk/assets/**/*",
        "node_modules/@ministryofjustice/frontend/moj/assets/images/**/*",
      ],
      {
        ignored:
          /(?:node_modules\/(?!govuk-frontend|@ministryofjustice))|public/v,
        persistent: true,
        ignoreInitial: true,
      },
    );

    watcher.on("change", (filePath) => {
      console.log(`\n🔄 File changed: ${filePath}`);

      if (filePath.includes("node_modules")) {
        void copyAssets();
      } else if (filePath.endsWith(".scss")) {
        void buildScss();
      } else if (filePath.endsWith(".ts") || filePath.endsWith(".js")) {
        void Promise.all([buildAppJs(), buildFrontendPackages()]);
      }
    });

    console.log(
      "✅ Bun Watch mode started successfully. Watching for file changes...",
    );

    process.on("SIGINT", () => {
      void (async () => {
        console.log("\n🛑 Stopping watch mode...");
        await watcher.close();
        process.exit(NO_MORE_ASYNC_OPERATIONS);
      })();
    });
  } catch (error) {
    console.error("❌ Watch process failed:", error);
  }
};

const build = async (): Promise<void> => {
  try {
    console.log("🚀 Starting Bun build process...");
    await copyAssets();
    await Promise.all([
      buildScss(),
      buildAppJs(),
      // buildCustomJs(),
      buildFrontendPackages(),
    ]);
    console.log("✅ Build completed successfully.");
  } catch (error: unknown) {
    console.error("❌ Build process failed:", error);
    process.exit(UNCAUGHT_FATAL_EXCEPTION);
  }
};

export { build, watchBuild };

// Bun's equivalent to import.meta.url check is import.meta.main
if (import.meta.main) {
  const isWatch = process.argv.includes("--watch");
  if (isWatch) {
    watchBuild().catch(() => process.exit(UNCAUGHT_FATAL_EXCEPTION));
  } else {
    build().catch(() => process.exit(UNCAUGHT_FATAL_EXCEPTION));
  }
}
