# buildroom-agent-lab

A minimal room-planning orchestration lab built with Next.js, TypeScript, Vitest and Playwright. Four simulated agents share typed state, with deterministic execution and an interactive trace inspector. All workflow execution happens in the browser; no API keys, database, paid APIs, live IKEA requests, or billing-required services are needed.

## Local setup

1. Install Node.js 22 and npm (validated with Node 22.19.0).
2. Clone the repository and check out `feat/agent-lab-foundation`.
3. Run `npm ci` to install the pinned lockfile.
4. Run `npm run dev` and open http://localhost:3000.
5. Choose a scenario, edit the brief/budget and click **Run workflow**. Select trace events to inspect their state snapshots; filter by agent or expand the full workflow JSON.

No environment variables are required. All inputs and traces live in page memory and disappear on reload. The trace is produced synchronously, then displayed; this is not token streaming or real model reasoning.

## Architecture

`src/lib/workflow.ts` defines the state, provider/tool interfaces, fixtures and orchestrator. `src/app/page.tsx` renders the interactive lab.

| Agent | Responsibility | Next |
| --- | --- | --- |
| RoomAgent | Derive a room purpose and style using fixed keyword rules | DesignAgent |
| DesignAgent | Ask FakeLLMProvider for a deterministic search phrase | SearchAgent |
| SearchAgent | Select mock catalogue items within the total budget | RenderAgent |
| RenderAgent | Produce an illustrative product plan and total | Completed |

The mock catalogue contains BILLY, POÄNG and LACK fixtures with fictional GBP prices. Selection uses a stable catalogue order and remaining budget; the mock search accepts a query but does not implement semantic relevance. The render is a product summary, not a photorealistic room render. No affiliation with IKEA is implied.

### Execution guarantees

- Typed shared workflow state tracks next agent, terminal status, attempts, completed search keys, results and immutable trace snapshots.
- Identical input and options with the default mocks produce identical state and trace. Event IDs and step counts are logical counters, without random IDs or wall-clock timestamps.
- Each failed agent gets at most two retries after its initial attempt by default. Provider and search exceptions share the same retry boundary. Failures do not mark a search successful, so transient recovery is possible.
- Successful search keys are normalized by trimming, lowercasing and collapsing whitespace. Repeated keys terminate before another tool call.
- The default global limit is 12 attempted agent steps, including retries. A termination event can be appended without consuming another step. Step limits are restricted to 1–100; retry limits to 0–10.
- Every run ends as `completed`, `failed` or `terminated` with `next: null`. Prior snapshots are cloned and runs do not share mutable state.
- Tool interfaces are synchronous and intended for trusted local simulations. These bounds limit orchestration iterations, not a tool that blocks indefinitely. Real async tools would need cancellation, deadlines, schema validation and persistence before integration.

Scenarios cover success, one transient catalogue failure, persistent failure, a repeated search and a three-step termination cap. Workflow limits and injected fake providers/tools are configurable in tests through `runWorkflow` options.

## Validation

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts the production build on port 3100; the port must be free. Linux CI installs Chromium system dependencies using `npx playwright install --with-deps chromium`. Tests cover success, recovery, exhausted retries, duplicate searches, global limits, invalid bounds, isolation, snapshot inspection, filtering, reruns and mobile overflow. See [docs/validation.md](docs/validation.md) for actual local results and any limitations.

## GitHub CI and pull request

`.github/workflows/ci.yml` runs on PRs and pushes to main or `feat/**`: clean install, type check, Vitest, production build, Chromium installation and Playwright. It uses read-only repository permissions, a 15-minute timeout, cancellation of superseded runs and retained browser reports. No deployment tokens are stored in Actions.

The feature branch must remain unmerged. Once a GitHub remote and authenticated CLI are available:

```sh
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
# Only for a new, empty remote: publish the empty baseline first.
git push -u origin main
git push -u origin feat/agent-lab-foundation
gh pr create --base main --head feat/agent-lab-foundation \
  --title "Build deterministic multi-agent room planning lab" \
  --body-file docs/pull-request.md
```

For an existing remote with history, fetch and base the feature branch on its main branch before publishing; do not overwrite existing history. Enable the `validate` check as a required branch protection check in GitHub settings if desired. CI is configured but is not considered verified until a GitHub run succeeds.

## Vercel Hobby and PR previews

1. Use your personal GitHub repository and Vercel Hobby account. [Hobby](https://vercel.com/docs/plans/hobby) is intended for personal, non-commercial use; confirm your project fits its terms. No paid integration is required by this app.
2. In Vercel, import the repository through the GitHub integration and grant access to that repository.
3. Set framework to **Next.js**, root to the repository root, Node.js to **22.x**, install command to `npm ci`, build command to `npm run build`, and production branch to `main`. `vercel.json` declares the framework and commands. No environment variables are required.
4. Keep the feature branch as a non-production branch. With the Git integration connected, branch pushes and PRs create Preview deployments. The initial empty main baseline does not contain an app; import/build the feature branch for the first preview, keeping `main` as the production branch. A production deployment waits for a separately authorized future merge.
5. Ensure the commit author is recognized as the Hobby project owner. Review repository/account eligibility in [Vercel Git deployment documentation](https://vercel.com/docs/git) and [GitHub integration documentation](https://vercel.com/docs/git/vercel-for-github).
6. Open the actual Preview URL from the PR's Vercel check. Verify the page loads and all five scenarios reach their expected status, and inspect a trace snapshot on desktop and mobile. Deployment protection may require Vercel sign-in. Record that URL and the verified commit in the PR.

**Deployment status: not deployed or verified.** Repository configuration does not connect a Vercel account or create a Preview URL. Do not treat local tests or a production build as proof of deployment.
