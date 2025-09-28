# Repository Guidelines

## Project Structure & Module Organization
The codebase uses the Next.js App Router. Primary surfaces live under `app/`, with `app/page.tsx` for the recipe finder, `app/test-extraction/page.tsx` for manual extraction QA, `app/api/` for server routes, and `app/assets/` for static modules. Shared UI sits in `components/` (PascalCase files). Domain logic and agent orchestration live under `lib/` — `lib/agents/recipe-agent.ts` coordinates AI calls, `lib/tools/` holds supporting helpers, `lib/types/` defines shared TypeScript models, and `lib/utils/` contains parsers. Static assets go in `public/`.

## Build, Test, and Development Commands
Run `npm run dev` for the Turbopack-powered dev server (`http://localhost:3000`). Use `npm run build` to create a production bundle and surface type errors. Serve the optimized build locally with `npm run start` after running `npm run build`. Install dependencies with `npm install`.

## Coding Style & Naming Conventions
TypeScript is required (`strict` mode enabled in `tsconfig.json`). Stick to 2-space indentation and trailing commas where Prettier defaults apply. Name React components in PascalCase (`RecipeFinder`), hooks and utilities in camelCase (`parseStreamedRecipeResponse`). Prefer function components with explicit prop types from `lib/types`. Tailwind CSS 4 utility classes drive styling; extend theme tokens in `app/globals.css` rather than inline hex values when possible.

## Testing Guidelines
Automated tests are not yet configured. For now, validate flows manually via `npm run dev`, the main recipe finder at `/`, and the extraction QA surface at `/test-extraction`. When adding tests, favor Playwright or React Testing Library colocated beside the feature (`components/MyWidget.test.tsx`) and ensure they run in CI via a future `npm test` script. Capture API regressions with mock fetch responses before checking in significant changes.

## Commit & Pull Request Guidelines
Keep commit subjects short and imperative (`Add streaming parser fix`). Group related file updates, breaking large refactors into clear steps. PRs should include: a concise summary, reproduction or verification notes (commands run, URLs exercised), screenshots or GIFs for UI tweaks, and links to relevant issues or tickets. Request review from at least one project maintainer and ensure your branch is rebased onto the latest `main` before approval.

## Agent-Specific Notes
`lib/agents/recipe-agent.ts` defines the AI interaction workflow. Update prompt templates and tool wiring there, and document new agent abilities in the PR. When experimenting with new tools, scaffold helpers in `lib/tools`, export types in `lib/types`, and gate unfinished work behind feature flags to protect production builds.
