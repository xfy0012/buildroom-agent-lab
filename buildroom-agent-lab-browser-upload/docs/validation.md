# Validation record

Local validation on 2026-11-06, macOS, Node.js 22.19.0, npm 10.9.3.

| Command | Actual result |
| --- | --- |
| `npm ci --offline` | Passed; 65 packages installed from the local npm cache |
| `npm run typecheck` | Passed |
| `npm test` | Passed; 25 tests in one file, Vitest 5.0.5 |
| `npm run build` | Passed; Next.js 16.4.2, static `/` and `/_not-found` routes |
| `npm run test:e2e` | Passed; 5 Chromium tests, 6.7 seconds, against the production build |
| `npm audit --omit=dev` | Passed; zero reported production dependency vulnerabilities |

The first dependency resolution attempt failed with an npm resolver error after registry DNS failures. Dependencies were pinned to versions available in the local cache and installed using a generated lockfile. The first type check exposed a TypeScript control-flow narrowing error around a terminal transition; it was fixed before the passing test and build runs above. Chromium was already installed on this machine. Browser runs emitted harmless NO_COLOR/FORCE_COLOR warnings.

The browser suite covers trace selection and state content, agent filtering, a second run with state reset, repeated-search termination, transient recovery, permanent failure, step-limit termination and a 390px mobile viewport with no horizontal overflow. Vitest also covers actual throwing provider/tool implementations, zero retries, exact-limit success, budget constraints, invalid limits, deterministic output and run isolation.

GitHub Actions is configured but has not run remotely. No GitHub remote or authenticated GitHub connection was available when this record was written; the feature branch and prepared PR body are local. No pull request or Vercel deployment has been created, and no Preview URL has been verified.
