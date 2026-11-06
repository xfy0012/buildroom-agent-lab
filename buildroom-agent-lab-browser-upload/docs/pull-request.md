## What changes

Creates a Next.js and TypeScript room-planning lab with RoomAgent, DesignAgent, SearchAgent and RenderAgent. The deterministic workflow uses shared typed state, FakeLLMProvider and fictional IKEA UK catalogue data. An interactive trace viewer exposes event snapshots, filtering, terminal reasons and the resulting product plan.

Failures retry within per-agent and global bounds; duplicate searches terminate before a second catalogue call. Five selectable scenarios make these behaviors reproducible without external services or credentials.

Adds Vitest and Playwright coverage, GitHub Actions CI, Vercel framework configuration and setup instructions for Hobby PR previews. No merge or paid service is required.

## Validation

See docs/validation.md for actual local command results. GitHub-hosted CI and Vercel Preview verification remain pending until the repository is connected. No deployment is claimed.
