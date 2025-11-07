# Repository Guidelines

## Project Structure & Module Organization
- Root npm scripts orchestrate `frontend/` (React + Vite) and `backend/` (Express + TypeScript); planning docs live in `docs/` and SQL assets in `database/`.
- `frontend/src` groups `components/`, `layouts/`, `pages/`, `services/`, `store/contexts`, `types/`, and `utils/`; shared config lives under `config/` and UI tests bootstrap from `tests/vitest.setup.ts`.
- `backend/src` follows a layered layout: `config/` initializes env, `models/` wrap Mongo collections, `services/` host domain logic, `controllers/` expose routes wired in `routes/`, with cross-cutting helpers in `middleware/`, `utils/`, and `jobs/`; CLI scripts belong in `scripts/`.
- Generated assets (`frontend/dist/`, `backend/dist/`, `backend/backups/`, `backend/logs/`) are derived outputs; never edit them by hand.

## Build, Test, and Development Commands
- `npm run install-deps` (root) installs dependencies for both apps.
- `npm run dev` / `npm run build` / `npm run test` (root) proxy to the frontend Vite workflow; use `npm run lint` before pushing UI changes.
- `npm --prefix backend run dev` starts the API with Nodemon; follow with `npm --prefix backend run build` plus `npm --prefix backend run start` to serve compiled output.
- `npm --prefix frontend run test:e2e` executes Playwright specs; append `--ui` during debugging.

## Coding Style & Naming Conventions
- Code is TypeScript-first with 2-space indentation and single quotes; rely on the existing ESLint config (`eslint.config.js`) instead of ad-hoc formatting.
- React components, layouts, and contexts use PascalCase file names; hooks begin with `use`, shared utilities stay in `utils/`, and service modules end with `Service.ts`.
- Tailwind CSS utilities power most styling; prefer composing utility classes over ad-hoc CSS.

## Testing Guidelines
- Unit and integration coverage runs through Vitest + Testing Library; colocate specs as `ComponentName.test.tsx` or `service.test.ts` near the subject and import `tests/vitest.setup.ts`.
- End-to-end regression is handled by Playwright in the frontend package; tag longer scenarios with `@slow` and guard them behind CI conditionals.
- The backend currently ships manual scripts (`test-password-reset-flow.js`); discuss new API test suites with maintainers before committing heavy dependencies.

## Commit & Pull Request Guidelines
- Follow the existing history by leading commit summaries with the feature or phase (for example, `Phase 7 and Phase 8 Restructuring at pending state`); keep them under 72 characters and add detail in the body if needed.
- PRs should include: purpose summary, affected modules, manual/automated test evidence, linked issue or task ID, and screenshots for UI updates; mention any `.env` mutations explicitly.
