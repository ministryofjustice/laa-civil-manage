# GitHub Copilot Instructions — laa-civil-manage

## 1. Before Starting Any Feature

1. **Ask for the Jira ticket ID** (`CM-XXXX`) if not provided. Check the branch name first.
2. **Clarify any ambiguous requirements** before writing code.
3. **Run the tests** to confirm a clean baseline: `bun run test:unit`.
4. **Find the nearest analogous existing feature** in `src/controllers/priorAuthority/{expert,counsel,disbursement}` and follow the same pattern exactly — the three journeys are deliberately symmetrical.

## 2. Workflow

- **Run tests after every change.** New tests must fail first, then pass after implementation. Fix code, not tests, if refactoring breaks them.
- **NEVER install a new dependency.** Stop and recommend a dependency for the user to install.
- **Keep business logic out of routes and views.** Routes only wire paths to controllers; views (`.njk`) only render.
- **When finished**, run all checks below.

### Checks before completing any task

```bash
bun run lint          # ESLint --fix
bunx tsc --noEmit      # TypeScript type check
bun run test:unit      # unit tests (bun test ./tests/unit)
```

**Write Playwright tests for any new page or journey step** (see Section 5) even though you should not run `bun run test:playwright` or `bun run test` yourself unless explicitly asked — Playwright needs Docker (WireMock + Redis) and is frequently unrunnable in sandboxed environments. Unit tests + `tsc` + lint are the default bar for verifying "done" in a sandbox; flag to the user that the new Playwright tests still need running where Docker is available.

### When editing existing files

- Make surgical changes only. Do not refactor unrelated code.
- Do not change test assertions without understanding why they were written that way.
- Fix linting failures — do not suppress rules unless unavoidable and justified.

If these instructions do not cover a specific case, stop and ask.

### Git hooks

This repo uses Lefthook (`lefthook.yml`): `pre-commit` runs `lint-staged`, and `pre-push` runs **both** `bun run test:unit` and `bun run test:playwright`. Never suggest `git commit --no-verify` or `git push --no-verify` to work around a failing hook — fix the underlying issue, or tell the user Playwright needs Docker running locally for the push to succeed.

## 3. Architecture

This is an Express + Nunjucks server-rendered app (no client-side framework), bundled with `esbuild.ts` and run on Bun.

- **Routes** (`src/routes/`) — Express routers, no business logic. Prior Authority journeys are nested under `src/routes/priorAuthority/{expert,counsel,disbursement}/` and wired together in `priorAuthorityRouter.ts`.
- **Controllers** (`src/controllers/`) — request handlers: read/write `req.session`, call models, call validators, `res.render`/`res.redirect`. Mirror the routes folder structure under `priorAuthority/`.
- **Models** (`src/models/`) — data access (calling the backend API), e.g. `applications.models.ts`, `priorAuthorityModels.ts`. No Express `req`/`res` here.
- **Middleware** (`src/middleware/`) — cross-cutting concerns (auth, session, CSRF, validation, document upload). Prior Authority-specific middleware lives under `middleware/priorAuthority/`.
- **Validation** (`src/validation/priorAuthority/`) — Zod schemas per journey, mirrored under `{expert,counsel,disbursement}/shared`.
- **Utils / mappers** (`src/utils/`, `src/utils/mappers/`) — pure helpers, e.g. mapping session state to API request shapes (`priorAuthorityApplicationMapper.ts`).
- **Views** (`src/views/`) — Nunjucks templates, logic-free, using GOV.UK/MOJ Frontend macros.
- **Types** (`src/types/`) — shared TypeScript types/interfaces, including `express`/`express-session` module augmentation.

### Prior Authority journey pattern (Expert / Counsel / Disbursement)

Each journey follows: **landing page → details → justification → document upload → check-your-answers → confirmation**. Session state lives at `req.session.priorAuthority.{expert,counsel,disbursement}`, with `type` set only by the landing-page controller (`startExpertJourney`/`startCounselJourney`/`startDisbursementJourney`) — required before submission. When adding a field to one journey, check whether the equivalent field/page should exist in the other two for consistency.

## 4. Coding Conventions

- TypeScript throughout, ES modules (`import`/`export`), never `require()`.
- Use the `#src/` (or `#*`) import alias with `.js` extensions on relative/aliased imports (NodeNext resolution). Use `import type` for type-only imports.
- Validate input with `zod` schemas in `src/validation/`; validation errors should re-render the form with error summaries, not throw.
- Use the typed `config` object (`src/config.ts`) instead of accessing `process.env` directly elsewhere.
- Use the `logger` (`src/utils/logger.ts`) instead of `console.log`.
- Always handle rejected promises explicitly (`async`/`await` with `try`/`catch`, or `.catch`).
- Lint is `eslint-config-love` based — private class members use `#field` (not the `private` keyword), and `return await` is enforced in async-return contexts.
- Errors thrown from models/mappers should use the custom error classes in `src/utils/errors.ts` (`ValidationError`, `SigningError`, `VerifyError`) or the `CustomError`/`isCustomError` shape, not plain `Error`/thrown strings — controllers catch these and `next(err)` to `serverErrors` in `errorController.ts`, which renders `errors/index.njk` (never a raw stack trace to the user).

### Content Security Policy (CSP)

Helmet (`src/utils/setupHelmet.ts`) sends a strict CSP with a per-response nonce (`res.locals.cspNonce`) on every page:

- Never add `<script src="https://...">` pointing at a public CDN — bundle new frontend dependencies through Bun/esbuild and serve them from `public/js`.
- Any inline `<script>` in a `.njk` template must include `nonce="{{ cspNonce }}"` or it will be silently blocked by the browser.
- Prefer external script files over inline scripts.
- Don't introduce new inline styles beyond what GOV.UK/MOJ Frontend already requires (`style-src 'unsafe-inline'` is a known, accepted exception — don't try to "fix" it).

### Naming

| Thing                 | Convention                  | Example                                                  |
| --------------------- | --------------------------- | -------------------------------------------------------- |
| Files/folders         | `camelCase`                 | `applications.controller.ts`                             |
| Classes               | `PascalCase`                | n/a — this codebase is mostly functional/functions-based |
| Interfaces/types      | `PascalCase`, no `I` prefix | `PriorAuthorityDisbursement`                             |
| Constants             | `UPPER_SNAKE_CASE`          | defined in `src/constants.ts`                            |
| Variables/params      | `camelCase`                 | `disbursementAmount`                                     |
| Private class members | `#camelCase`                | `#formatRows`                                            |
| Nunjucks templates    | `camelCase.njk`             | `checkYourAnswersSummary.njk`                            |
| URL paths             | `kebab-case`                | `/prior-authority/disbursement/details`                  |
| Test files            | `[name].spec.ts`            | `disbursementController.spec.ts`                         |

## 5. Testing Standards

### Unit Tests (`bun test`, under `tests/unit/`)

- Test files mirror the `src/` structure (e.g. `tests/unit/controllers/priorAuthority/disbursementController.spec.ts`).
- Prefer top-level imports plus `spyOn(...)` in `beforeEach` over `mock.module(...)` (late-import) patterns — this repo's lint disallows imports after executable statements.
- For controllers that read `req.session` directly, build a plain fake `req.session` object in the test rather than mocking modules.
- Every controller/model needs a happy-path test and an error/validation-path test.
- Test observable behaviour (`res.render`/`res.redirect` args, session writes) — not implementation details.

### Playwright E2E Tests (`tests/playwright/`)

- **Always add Playwright tests when building a new page or journey step** — do not skip this because Playwright can't be run in-sandbox; write the spec anyway and tell the user it still needs running where Docker is available.
- **Always add every new page's URL to the `pages` array in `src/constants.ts`.** `tests/playwright/template.spec.ts` iterates that array for header/footer/navigation/phase-banner checks and axe accessibility scans — a page missing from `pages` is silently excluded from accessibility testing.
- Requires Docker (WireMock on 8081/8443, Redis on 6379) — check for leftover containers/ports (`docker ps`, `lsof -i :PORT`) before running; kill stale `wiremock-pw`/`redis-pw-*` containers or a leftover `bun public/index.js` on port 3000 if `bunx playwright test` fails with "already used".
- WireMock mappings live in `tests/resources/wiremock`; keep mappings in sync with any new backend calls (e.g. document upload endpoints).
- Each journey step should cover: happy path, each validation error, back/continue navigation, and accessibility (`checkAccessibility`).

## 6. Exploration

Always output exploration notes and plans as a markdown file in a session/scratch location, not committed into the repo.
