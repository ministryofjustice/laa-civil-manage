import { readFile } from "node:fs/promises";
import path from "node:path";
import { createInstrumenter } from "istanbul-lib-instrument";
import type { BunPlugin } from "bun";

const createIstanbulPlugin = (sourceRoot = path.resolve("src")): BunPlugin => {
  const sourceDirectory = `${sourceRoot}${path.sep}`;
  const instrumenter = createInstrumenter({
    compact: false,
    coverageGlobalScope: "globalThis",
    coverageGlobalScopeFunc: false,
    esModules: true,
    parserPlugins: ["typescript"],
  });

  return {
    name: "istanbul",
    setup(build) {
      build.onLoad({ filter: /\.ts$/v }, async (args) => {
        const source = await readFile(args.path, "utf8");

        if (!args.path.startsWith(sourceDirectory)) {
          return { contents: source, loader: "ts" };
        }

        return {
          contents: instrumenter.instrumentSync(source, args.path),
          loader: "ts",
        };
      });
    },
  };
};

export { createIstanbulPlugin };
