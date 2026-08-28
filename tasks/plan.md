# Implementation Plan: Tonight's First Tables

Implements `SPEC.md` (approved). Tasks are tracked in `tasks/todo.md` — no external tracker is designated in `AGENTS.md` or `CLAUDE.md`, so the default markdown checklist applies.

## Overview

A single-page Next.js app at `/` listing tonight's 10 discounted first tables, filterable by cuisine and suburb, bookable with a name and email. Each restaurant's table can be claimed exactly once. All state is in memory, no new dependencies, no automated tests — verification is `npm run build` plus a scripted manual walkthrough. Target ~65 minutes.

## Architecture Decisions

Carried from the spec, restated here because they drive task ordering:

- **One mutating function.** `claimFirstTable` in `src/lib/bookings/store.ts` is the only way a booking is created. Everything else reads.
- **The critical section is synchronous.** No `await` between the availability check and the write, so concurrent requests cannot interleave into it. This is a property of how the function is written, not something added later.
- **The store is pinned to `globalThis`** so HMR re-evaluation and separate module graphs share one map.
- **Server Action in its own `"use server"` file**, imported by a client component. Cards are client components (they own filter and form state); the page is a Server Component that reads availability.
- **The page renders dynamically.** Availability must never be prerendered or served from the router cache after a claim.

## Dependency Graph

```
src/data/restaurants.json          (seed data)
        │
        └── src/lib/restaurants.ts (types, loader, filter options, filter fn)
                    │
                    ├── src/lib/bookings/store.ts   (claimFirstTable, availability)
                    │           │
                    │           └── src/app/actions.ts        (bookTable Server Action)
                    │                       │
                    │                       └── src/components/RestaurantCard.tsx
                    │                                   │
                    ├── src/components/RestaurantBrowser.tsx ┘
                    │                                   │
                    └── src/app/page.tsx ───────────────┘
```

Build bottom-up: data and types first, then each vertical slice through to the UI.

## Task List

Full acceptance criteria, verification steps, and file lists live in `tasks/todo.md`. Ordered index:

### Phase 1: Foundation and Browse
- Task 1: Seed data, domain types, loader
- Task 2: Browse — render all 10 first tables

### Checkpoint A: Browse

### Phase 2: Filter
- Task 3: Filter by cuisine and suburb

### Checkpoint B: Filter

### Phase 3: Booking and the Guard
- Task 4: Booking store and `claimFirstTable`
- Task 5: Book a table (happy path)
- Task 6: Double-booking guard surfaced in the UI

### Checkpoint C: The Guard — the one that matters

### Phase 4: Close-out
- Task 7: Polish
- Task 8: Reflection and spec reconciliation

### Checkpoint D: Complete

## Ordering Rationale, and One Deliberate Deviation

The skill says put high-risk tasks early to fail fast. The highest-risk item here is the double-booking guard, and it is built fourth. That is deliberate, and it is safe for a specific reason worth stating:

**The guard is not a feature that gets added in Task 6.** `claimFirstTable` is correct the moment it is written in Task 4 — the synchronous critical section is the whole mechanism, and it is three lines. Task 6 does not *implement* the guard; it surfaces an already-enforced rule in the UI (booked styling, rejection message, refresh after claim). So the risk that "we ran out of time before doing the guard" doesn't really exist: the enforcement lands with the store, and there is no intermediate state where bookings are possible but unguarded.

What could still be lost to a time overrun is the *presentation* of a rejection — a diner seeing a raw error instead of "just been taken." That is a genuine but much smaller loss, and it is why polish sits behind Task 6 in the cut order.

The other deviation: the spec's priority order (browse → filter → book → guard) is a product instruction from the reviewer, and it also matches what the brief is assessing. Where it conflicts with fail-fast, the spec wins.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Next.js 16 APIs differ from training data (`refresh()` from `next/cache`, typed `LayoutProps`/`PageProps`, cache semantics) | High | Bundled docs are in `node_modules/next/dist/docs/`. Read the relevant page before writing page, action, or cache code. Trust `npm run build`, not recall. |
| HMR resets the store mid-manual-test and looks like a guard failure | Medium | `globalThis` pin; restart `next dev` before the two-tab walkthrough and don't edit files during it. A reset store is a false negative, not a bug. |
| `/` gets statically prerendered, so a booked table still shows as available | Medium | Page must render dynamically. Verified explicitly at Checkpoint C with a hard refresh, not just a soft navigation. |
| Server/Client boundary errors — passing non-serializable props or defining the action in a client file | Medium | Action lives in `src/app/actions.ts` with a file-level `"use server"`, imported by the client card. Caught by `npm run build`. |
| Someone later adds an `await` inside the critical section | Medium | Comment on the function stating the invariant; Boundaries entry in the spec; explicit code-read at Checkpoint C. With no automated tests, this read *is* the regression net. |
| Time overrun | Medium | Documented cut order: polish first, then filter match count and empty state. The guard and the reflection are never cut. |
| Scope creep into the Deferred list | Low | Deferred list in the spec is explicit; anything on it needs a decision, not a drive-by commit. |

## Verification Checkpoints

Run after the listed tasks, before proceeding.

### Checkpoint A: Browse (after Tasks 1–2)
- [ ] `npm run build` passes clean
- [ ] `npm run lint` passes clean
- [ ] `/` shows all 10 restaurants, each with every field required by Success Criterion 1
- [ ] No `create-next-app` boilerplate remains

### Checkpoint B: Filter (after Task 3)
- [ ] Cuisine and suburb each filter correctly on their own, and combine
- [ ] Both default to "All"; options are derived from the data and deduplicated
- [ ] A combination matching nothing shows an empty state, not a blank page
- [ ] Match count is accurate

### Checkpoint C: The Guard (after Tasks 4–6) — human review gate
- [ ] Read `claimFirstTable` and confirm no `await` between the availability check and the write
- [ ] Confirm no code path writes a booking except through `claimFirstTable`
- [ ] Restart the dev server, then run the full two-tab walkthrough from `SPEC.md` — all five steps
- [ ] A booked table survives a hard refresh as booked (proves the page isn't statically cached)
- [ ] Blank name and malformed email are both rejected server-side with no booking created
- [ ] `npm run build` passes clean

### Checkpoint D: Complete (after Tasks 7–8)
- [ ] All nine Success Criteria in `SPEC.md` demonstrably met
- [ ] `npm run build` and `npm run lint` both clean
- [ ] `REFLECTION.md` written
- [ ] `SPEC.md` reconciled with what was actually built

## Definition of Done

The skill references a project-wide Definition of Done at `.agents/references/definition-of-done.md`, which does not exist in this repo. Minimal standing bar, inlined so tasks have something to clear:

1. `npm run build` and `npm run lint` pass.
2. No TypeScript errors; no `any` introduced.
3. No new dependencies (spec Boundaries).
4. Behaviour matches the Success Criterion the task claims, checked in a browser.
5. No boilerplate, dead code, or commented-out experiments left behind.

## Parallelization

Effectively none. This is one agent working a linear dependency chain inside an hour, and the coordination overhead of splitting it would exceed the work saved.

The one genuinely independent unit is Task 4 (`src/lib/bookings/store.ts`) — it depends only on the id set from Task 1 and touches no UI. If a second agent were available, it could be built alongside Tasks 2–3. Recorded for completeness; not recommended here.

## Open Questions

Carried unresolved from `SPEC.md` — none block Task 1, and defaults are assumed if no answer arrives:

1. **Restart behaviour** — bookings vanish when the server restarts. Assumed acceptable.
2. **Confirmation placement** — assumed inline on the card rather than a modal.
3. **Stop-point** — assumed: if the hour runs out mid-polish, stop and write the reflection.
