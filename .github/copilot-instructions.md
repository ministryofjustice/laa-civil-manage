# GitHub Copilot Instructions — laa-civil-manage

## 1. Before Starting Any Feature

1. **Ask for the Jira ticket ID** (`CM-XXX`) if not provided.
2. **Clarify any ambiguous requirements** before writing code.
3. **Confirm a clean baseline**: `bun run test:unit` and `bunx eslint . && bunx prettier --check .`.
4. **Find the nearest analogous existing feature** (e.g. `src/routes/applications.router.ts` +
   `src/controllers/applications.controller.ts`) and follow the same pattern.

## 2. Workflow

- **Run tests after every change.** New tests must fail first, then pass once implemented.
- **NEVER install a new dependency** without checking with the user first — recommend it instead.
- **Keep business/data logic out of controllers.** Controllers handle request/response only; data
  fetching and shaping lives in `models/` and `utils/`.
- **Views are GOV.UK Design System Nunjucks templates** — reuse existing macros/components in
  `src/views/` rather than hand-rolling HTML.
- **When finished**, run all checks below and update any related docs.

### Checks before completing any task

```bash
bunx eslint .              # Linting (eslint-config-love + Prettier)
bunx prettier --check .    # Formatting
bun run test:unit          # Unit tests (with coverage threshold)
bun run test:playwright    # Playwright e2e (requires mise/docker for Redis + build)
```

### When editing existing files

- Make surgical changes only. Do not refactor unrelated code.
- Do not change test assertions without understanding why they were written that way.
- Fix linting failures — do not suppress rules unless unavoidable and justified.

If these instructions do not cover a specific case, stop and ask.

## 3. Architecture Rules

This is an **Express 5 + TypeScript + Nunjucks** server-rendered app, run on **Bun**.

- **`src/routes/`** — Express routers. Wire URL paths to controller functions only.
- **`src/controllers/`** — request/response handling: parse input, call `models/`/`utils/`, render a
  view or redirect. No direct external API calls here.
- **`src/models/`** — data-access functions (calls to the API/backing services) and their TS types.
- **`src/validation/`** — Zod schemas / validation functions for form input, one file per feature area.
- **`src/middleware/`** — Express middleware (auth, session handling, per-journey helpers).
- **`src/utils/`** — pure helper/mapper functions (e.g. `utils/mappers/`).
- **`src/views/`** — Nunjucks templates, mirroring the route/controller feature structure.
- **`src/types/`** — shared/ambient TypeScript types (e.g. Express request augmentations).

### Adding a new endpoint

1. Add/extend a model function + types in `src/models/[resource].models.ts`.
2. Add a controller in `src/controllers/[resource].controller.ts` calling the model and rendering a view.
3. Add a router in `src/routes/[resource].router.ts` and mount it in the app's route setup.
4. Add a Nunjucks view under `src/views/[resource]/`.
5. Add Zod validation in `src/validation/[resource].validation.ts` if the endpoint accepts form input.
6. Write unit tests under `tests/unit/` mirroring the `src/` path.
7. Add/extend a Playwright test under `tests/playwright/` for the user-facing journey.

## 4. Coding Conventions

- TypeScript throughout, `strict: true`. Prefer explicit types on exported functions.
- Use the `#*` import alias (e.g. `#src/models/applications.models.js`) instead of relative `../../..` paths.
- Formatting/linting is enforced by Prettier + ESLint (`eslint-config-love`) — do not hand-format;
  run `bunx eslint . --fix` and `prettier --write .` (or let lefthook's pre-commit hook do it).
- Only import via the `#*` alias, not relative paths that escape the current directory tree (see
  `no-restricted-imports` in `eslint.config.js`).
- Use GOV.UK Design System components/macros for all UI; avoid custom CSS/HTML where a GOV.UK Frontend
  component exists.

### Naming

| Thing                     | Convention                                   | Example                                                                          |
| -------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| Files/folders (new code)   | `[resource].[layer].ts`, `camelCase` folders | `applications.controller.ts`, `applications.router.ts`, `applications.models.ts` |
| Classes/interfaces         | `PascalCase`                                  | `ApplicationSummary`, `PriorAuthorityDraft`                                      |
| Functions/variables        | `camelCase`                                   | `getAllApplicationsPage`, `parsePage`                                            |
| Constants                  | `UPPER_SNAKE_CASE`                            | `TRY_TWICE`                                                                      |
| URL paths                  | `kebab-case`                                  | `/prior-authority/expert/document-upload`                                        |
| Unit test files            | `[name].spec.ts`                              | `commonMiddleware.spec.ts`                                                       |
| Playwright test files      | `[journey].spec.ts` under `tests/playwright/[feature]/` | `tests/playwright/priorAuthority/expert/*.spec.ts`                     |

> Note: some older code under `src/controllers/priorAuthority/**` uses `[name]Controller.ts` /
> `[name]Router.ts` (no dot, camelCase suffix) instead of the dot-suffix form above. New code should use
> the dot-suffix convention (matching `applications.*`); don't rename old files as a drive-by change.

## 5. Testing Standards

- **Unit tests** (`tests/unit/`, Bun's built-in test runner): mirror the `src/` folder structure
  one-for-one. Use `*.spec.ts`. Preload env fixtures via `tests/unit/testEnv.ts` (already wired in
  `bunfig.toml`).
- **Playwright tests** (`tests/playwright/`): mirror the user journey/feature folder structure (e.g.
  `priorAuthority/expert/`). Assert on GOV.UK page structure via accessible roles (`getByRole`), not
  CSS selectors, where practical.
- Run `bun run test:unit` before every commit; `bun run test:playwright` before opening a PR (also runs
  automatically pre-push via lefthook and in CI).

## 6. Code Coverage

- Enforced via Bun's built-in coverage, configured in `bunfig.toml`. Current floor: 80% lines,
  75% functions (set just below today's baseline — 82.65% lines / 76.05% funcs — to stop regression
  without blocking on pre-existing gaps). `bun run test:unit` fails if coverage drops below this.
- **Raise the thresholds as coverage improves** — don't lower them to make a failing PR pass.
- When adding new modules, add matching unit tests in the same change — do not rely on unrelated tests
  to keep coverage numbers up.
- If a change legitimately can't be unit tested (e.g. thin wiring code), prefer covering it via a
  Playwright test instead of skipping coverage checks.

## 7. Exploration

Output exploration notes and plans as a markdown file outside the repo (e.g. session workspace), not
committed to the repo.
