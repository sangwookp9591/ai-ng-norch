# norch

Real-time agent activity monitor for **aing v2.5.0**.

Visualizes 14 named AI agents working together in a 3D office environment, with live event streaming over Unix sockets.

## Agents (v2.5.0)

| Agent | Role | Model |
|-------|------|-------|
| Sam | CTO / Lead / Boil the Lake | opus |
| Able | PM / Planning / Office Hours 6-question | sonnet |
| Klay | Architect / Explorer | opus |
| Jay | Backend / API | sonnet |
| Jerry | DB / Infrastructure | sonnet |
| Milla | Security / Reviewer / CSO 14-phase | sonnet |
| Jun | Performance / Optimization | sonnet |
| Willji | UI/UX Designer / AI Slop Detection | sonnet |
| Iron | Frontend / Build | sonnet |
| Rowan | Motion / Interaction | sonnet |
| Derek | Mobile / Flutter | sonnet |
| Simon | Code Intelligence | sonnet |
| Progress-Checker | Read-only status monitoring | sonnet |
| Figma-Reader | Figma design analysis | sonnet |

## Features

- **3D Office View** -- agents occupy desks in a spatial layout; activity animates in real time
- **4-Tier Review Pipeline** -- visualizes review events (`review-pipeline`) across quality, security, performance, and API tiers
- **Ship Workflow Tracking** -- monitors `ship-start`, `ship-step`, `ship-complete` lifecycle events
- **CSO Audit Events** -- displays Milla's 14-phase security audit progress (`cso-audit`)
- **PDCA Cycle** -- Plan / Do / Check / Act / Review phase indicator
- **Timeline** -- scrollable event log with agent avatars and tool usage

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the monitor.

### Demo Mode

```bash
# Start the server first, then run the demo script
node server/demo.mjs
```

### Integration with aing

```js
import { notifyNorch } from './server/aing-adapter.mjs';

notifyNorch.sessionStart(sessionId);
notifyNorch.agentSpawn(sessionId, 'sam', 'CTO 검증 시작');
notifyNorch.reviewPipeline(sessionId, { tier: 1, reviewer: 'milla', status: 'pass' });
notifyNorch.shipStart(sessionId);
notifyNorch.csoAudit(sessionId, { phase: 3, finding: 'clean', severity: 'info' });
```

## Architecture

- **Next.js App Router** -- UI and SSE endpoint
- **Unix Socket Server** (`server/norch-server.mjs`) -- receives events from aing hooks
- **aing Adapter** (`server/aing-adapter.mjs`) -- fire-and-forget event relay for hook handlers
