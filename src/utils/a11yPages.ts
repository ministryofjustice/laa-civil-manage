import router from "#src/routes/index.router.js";
import type { Router } from "express";

interface RouteDef {
  path: string | string[];
  methods: Record<string, boolean | undefined>;
}

interface RouteLayer {
  route?: RouteDef;
  name?: string;
  handle?: unknown;
}

interface RouterWithStack {
  stack: RouteLayer[];
}

const isContainer = (value: unknown): value is Record<string, unknown> =>
  (typeof value === "object" || typeof value === "function") && value !== null;

const hasStack = (value: unknown): value is RouterWithStack => {
  if (!isContainer(value)) {
    return false;
  }

  return Array.isArray(Reflect.get(value, "stack"));
};

const getRouteDef = (value: unknown): RouteDef | undefined => {
  if (!isContainer(value)) {
    return undefined;
  }

  const path = Reflect.get(value, "path");
  const methods = Reflect.get(value, "methods");
  const hasValidPath =
    typeof path === "string" ||
    (Array.isArray(path) && path.every((item) => typeof item === "string"));

  if (!hasValidPath || !isContainer(methods)) {
    return undefined;
  }

  const methodFlags: Record<string, boolean | undefined> = {};
  for (const [name, enabled] of Object.entries(methods)) {
    if (typeof enabled === "boolean" || typeof enabled === "undefined") {
      methodFlags[name] = enabled;
    }
  }

  return {
    path,
    methods: methodFlags,
  };
};

const isA11yPage = (path: string): boolean =>
  (path === "/" || path.startsWith("/pa-form/")) && !path.includes(":");

const collectGetRoutes = (targetRouter: Router): string[] => {
  const paths = new Set<string>();

  const visit = (currentRouter: unknown): void => {
    if (!hasStack(currentRouter)) {
      return;
    }

    for (const layer of currentRouter.stack) {
      const route = getRouteDef(layer.route);
      if (route?.methods.get === true) {
        const routePaths = Array.isArray(route.path) ? route.path : [route.path];

        for (const routePath of routePaths) {
          if (isA11yPage(routePath)) {
            paths.add(routePath);
          }
        }
      }

      if (layer.name === "router") {
        visit(layer.handle);
      }
    }
  };

  visit(targetRouter);
  return [...paths].sort();
};

export const a11yPages = collectGetRoutes(router);

