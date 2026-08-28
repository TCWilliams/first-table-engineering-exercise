# Spec: Tonight's First Tables

Status: **approved**. Plan in `tasks/plan.md`, tasks in `tasks/todo.md`.

Scoped to a ~1 hour prototype. Anything not listed under Success Criteria is out.

## Assumptions

Correct any of these now or I proceed with them.

1. **`restaurants.json` is not in the repo.** I'll transcribe the 10 records from the brief into `src/data/restaurants.json` verbatim and treat it as read-only seed data.
2. **Bookings live in memory only.** No database, no disk. Restarting the server clears them.
3. **One Node process** (`next dev`). The guard's correctness depends on this and says so below.
4. **No new dependencies at all.** Existing Next.js 16 / React 19 / Tailwind 4 only.
5. **No automated tests.** Verification is manual, per the steps below.
6. **Party size and booking fee are display-only.** Form is name + email, per the brief.
7. **Single page.** Everything on `/` — no per-restaurant route, no booking history.
8. **Filters are client-side React state**, not URL search params.

## Objective

A diner lands on `/`, sees tonight's discounted first tables, narrows them by cuisine and suburb, and books one with their name and email. Once a restaurant's first table is booked, nobody else can book it.

Build strictly in this order and stop wherever the hour ends: **browse → filter → book → double-booking guard → polish.** The guard is fourth because it needs booking to exist, but it is a hard requirement — polish gets cut before the guard does.

## The double-booking guard

### What could make it fail in this stack

**Interleaving across `await` points.** Node runs one JavaScript thread, which is often mistaken for "requests can't race." They can. The unit guaranteed not to interleave is a *synchronous* run of code, not a whole `async` function. Any booking logic shaped `read → await → check → write` lets the event loop run another request's read and check during that `await`. Both see "available," both write, two diners hold one table. Any `await` in the critical section opens this window — an `fs` call, a fetch, even `await Promise.resolve()`.

**Persisting to a JSON file.** Read `bookings.json` → mutate → write back is exactly the bug above, plus a lost update when two writes overlap. This is why persistence is cut rather than deferred to "if there's time."

**Module state resetting under the dev server.** A plain `const bookings = new Map()` at module scope is not one map. `next dev` re-evaluates modules on edit and discards the old one, and separate module graphs can each hold their own instance. Two callers then guard two different maps — worse than no guard, because it looks like it works.

**Checking availability only in the UI.** Hiding the Book button is presentation, not enforcement. A page rendered 30 seconds ago still shows it, and a Server Action is reachable by direct POST regardless of what rendered.

### How the design prevents it

`src/lib/bookings/store.ts` owns all booking state and exposes one mutating function, `claimFirstTable(restaurantId, diner)`.

1. **The critical section is synchronous.** `claimFirstTable` is a plain non-`async` function: it reads, checks, and writes with **no `await` between the check and the write**. Node cannot interleave another request into a synchronous run, so check-then-act is atomic by construction — no lock to take, no window to slip into. It returns a discriminated result so callers can't mistake failure for success.
2. **Nothing async goes inside it.** Validation happens before, the UI response after. This invariant is what keeps rule 1 true, so it's a comment on the function and a Boundaries entry below.
3. **The store is pinned to `globalThis`** (`globalThis.__firstTableStore ??= createStore()`), surviving HMR re-evaluation. One process, one map, one authority.
4. **Every write goes through `claimFirstTable`.** The card's disabled state is a hint, never enforcement.
5. **The submit button disables while the action is in flight**, via the `pending` flag from `useActionState`. This closes the double-click hole at the client so the common case never reaches the server twice. It is defence in depth, not the guard — a stale page still renders an enabled button, and the Server Action is reachable by direct POST whatever the UI shows.
6. **The page refreshes after a successful claim** and opts out of static rendering, so availability is never stale or prerendered.

The honest limit: this holds **within one Node process**. Two processes or a serverless deployment and it's gone. The production answer is to move atomicity into the database — a `UNIQUE` constraint on `bookings.restaurant_id`, or `UPDATE tables SET status='booked' WHERE id=$1 AND status='available'` treating zero affected rows as taken. `claimFirstTable` is shaped so that swap touches one function. This goes in the reflection.

### How you verify it

Manual, two tabs, ~2 minutes:

1. Open `/` in two browser windows side by side. Both show the same table as available.
2. Book it in window A. A confirms; A's card flips to booked.
3. Without refreshing, submit the same table in window B — B's page is now stale, which is the realistic failure case.
4. B is told the table has just been taken, sees no confirmation, and the card flips to booked.
5. Double-click submit on a fresh table: the button disables on the first click, and one confirmation appears.

Don't edit source files mid-test — an HMR reload resets the store and isn't a real failure.

**What this does not prove.** Two tabs is sequential; hand-clicking can't land inside a sub-millisecond interleaving window. True concurrency safety here rests on inspecting `claimFirstTable` and confirming no `await` sits between check and write. That argument, not a test, is the evidence — and it's recorded in the reflection.

## Tech Stack

Next.js 16.3.3 (App Router), React 19.2.8, TypeScript 5, Tailwind CSS 4 — all already installed. Nothing added.

## Commands

```
Dev:   npm run dev
Build: npm run build
Lint:  npm run lint
```

## Project Structure

```
src/app/page.tsx                     → Server Component: loads restaurants + availability
src/app/actions.ts                   → 'use server' — bookTable Server Action
src/components/RestaurantBrowser.tsx → 'use client' — filter state + card grid
src/components/RestaurantCard.tsx    → 'use client' — one card, booking form, result message
src/lib/bookings/store.ts            → globalThis-pinned store, claimFirstTable
src/lib/restaurants.ts               → typed loader, filter options, filter fn
src/data/restaurants.json            → seed data from the brief
SPEC.md / REFLECTION.md              → this file; reflection written last
```

## Code Style

TypeScript strict, double quotes, semicolons, inline Tailwind, function declarations for components. Failures are returned as discriminated unions, not thrown.

```ts
export type ClaimResult =
  | { ok: true; booking: Booking }
  | { ok: false; reason: "already_booked" | "unknown_restaurant" | "invalid_details" };

// Synchronous by design: no `await` may appear between the availability check and
// the write, or two concurrent requests can both pass the check.
export function claimFirstTable(restaurantId: number, diner: Diner): ClaimResult {
  const store = getStore();
  if (!store.restaurantIds.has(restaurantId)) {
    return { ok: false, reason: "unknown_restaurant" };
  }
  if (store.bookings.has(restaurantId)) {
    return { ok: false, reason: "already_booked" };
  }
  const booking: Booking = { restaurantId, ...diner, bookedAt: new Date().toISOString() };
  store.bookings.set(restaurantId, booking);
  return { ok: true, booking };
}
```

## Boundaries

**Always** — route every booking write through `claimFirstTable`; keep it synchronous from check to write; validate server-side; run `npm run build` before calling it done.

**Ask first** — any new dependency; persisting to disk; changing the shape of `restaurants.json`; anything in Deferred.

**Never** — add auth or payments; enforce availability only in the UI; add an `await` inside the claim critical section.

## Success Criteria

1. `/` lists all 10 first tables with name, cuisine, suburb, rating, review count, price level, time, party size range, discount, and booking fee.
2. Cuisine and suburb filters combine, default to "All", derive options from the data, and show a match count; an empty result shows an empty state.
3. Submitting name + email books a table and shows a confirmation naming the restaurant and time, with no full page reload.
4. A booked table renders unavailable in the same interaction, no manual refresh.
5. The submit button disables while a booking is in flight, so a double-click sends one request.
6. A second attempt on a taken table from a stale page is rejected server-side with a clear message and never a second confirmation — independently of criterion 5.
7. Blank name or malformed email is rejected server-side with a visible message and creates no booking.
8. `npm run build` passes clean.
9. The two-tab walkthrough above passes.

## Deferred

Cut deliberately, listed so it reads as a decision: durable persistence and the database unique constraint; automated tests of any kind; a `POST /api/bookings` handler for shell-based race testing (~5 min if you later want to run the race yourself); filter state in the URL; party-size selection; per-restaurant pages; sort controls; accessibility audit; cancelling a booking; optimistic UI.

## Time Estimate

| Slice | Est. |
|---|---|
| Data file, types, loader | 8 min |
| Browse: page + card grid | 12 min |
| Filter: cuisine + suburb + count + empty state | 8 min |
| Book: store, Server Action, form, confirmation | 15 min |
| Guard: stale-page rejection, refresh-after-claim | 5 min |
| Manual two-tab verification | 5 min |
| Polish: spacing, booked-state styling, empty state | 5 min |
| Reflection | 7 min |

**Total ~65 min**, realistically 55–75. The guard is nearly free once the store exists — its cost is in the design, which this spec has already paid. If time runs short, polish goes first, then the filter's match count and empty state; the guard and reflection do not get cut.

## Open Questions

1. **Restart behaviour** — bookings vanish on restart. Acceptable?
2. **Confirmation placement** — inline on the card (assumed, faster) or a modal?
3. **Stop-point** — if the hour runs out mid-polish, I stop and write the reflection. Confirm.
