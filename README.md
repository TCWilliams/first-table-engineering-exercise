# Tonight's First Tables

A small Next.js app for the First Table engineering exercise. A diner can browse tonight's discounted first tables, filter them by cuisine and suburb, and book one with a name and email. Each restaurant's first table can be booked exactly once.

Built as a ~1 hour prototype. Auth and payments are out of scope; the booking fee is display-only.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
```

```bash
npm run build   # production build
npm run lint    # eslint
```

There are no automated tests — that was a deliberate cut, and verification is the manual walkthrough below.

## Project structure

```
src/app/page.tsx                     Server Component: loads restaurants + availability
src/app/actions.ts                   bookTable Server Action
src/components/RestaurantBrowser.tsx Client: filter state + card grid
src/components/RestaurantCard.tsx    Client: one card, booking form, result states
src/lib/bookings/store.ts            Booking store and claimFirstTable — the guard lives here
src/lib/restaurants.ts               Typed loader, filter options, filter function
src/data/restaurants.json            Seed data, transcribed from the brief
```

`SPEC.md` holds the full specification and design rationale, `tasks/plan.md` the implementation plan and risks, `tasks/todo.md` the task-by-task record of what was built and verified, and `REFLECTION.md` the write-up.

## The double-booking guard

All booking state lives in `src/lib/bookings/store.ts`, which exposes one mutating function, `claimFirstTable`. It is deliberately **not** `async`: it reads the bookings map, checks availability and writes the booking with no `await` anywhere in between.

That matters because Node only guarantees a *synchronous* run of code can't be interleaved — not that an `async` function runs to completion. Booking logic shaped `read → await → check → write` lets a second request pass the same check during that `await`, and both diners end up holding the table. Keeping the critical section synchronous makes the check-and-act atomic by construction: no lock to acquire, no window to slip into.

Two related traps are avoided for the same reason:

- **The store is pinned to `globalThis`**, not held in a module-level `const`. The dev server re-evaluates modules on edit, and separate module graphs can each hold their own instance — two callers would then guard two different maps, which is worse than no guard because it still appears to work.
- **Bookings are never written to a JSON file.** Read-modify-write on a file reintroduces exactly the race the design removes, plus a lost update when two writes overlap. This is why persistence was cut outright rather than left as a nice-to-have.

The UI plays no part in enforcement. A booked card hides its form and the submit button disables while a request is in flight, but both are hints — the Server Action re-checks on every submission and is reachable by direct POST regardless of what rendered.

### Verifying it yourself

Restart the dev server first so the store is empty, and don't edit source files mid-test — an HMR reload reseeds the store and looks like a failure.

1. Open `/` in two browser windows side by side. Both show the same table as available.
2. Book it in window A. A shows a confirmation.
3. Without refreshing, submit the same table in window B — B's page is now stale, which is the realistic failure case.
4. B is told the table has just been taken, sees no confirmation, and the card flips to booked.
5. Hard-refresh both windows. The table is still booked.

**What this proves and doesn't.** Two tabs demonstrates the stale-page rejection, which is the failure a real diner would hit. It does not demonstrate interleaving safety — hand-clicking can't land inside a sub-millisecond window, and with a synchronous critical section there is no observable state where it could. That property rests on reading `claimFirstTable` and confirming no `await` sits between the check and the write.

### Known limit

The guarantee holds **within one Node process only**. Two processes, or a serverless deployment, and module state isn't shared and it evaporates. Bookings are also in memory, so they vanish on restart.

The production answer is to move atomicity into the database — a `UNIQUE` constraint on `bookings.restaurant_id` with the violation caught and mapped to "already booked", or `UPDATE tables SET status='booked' WHERE id = $1 AND status = 'available'` treating zero affected rows as taken. `claimFirstTable` is shaped so that swap touches one function.

## Built and cut

Delivered: browse, filter by cuisine and suburb, book with name and email, and the double-booking guard including the stale-page rejection.

Cut deliberately: automated tests, durable persistence, visual polish, filter state in the URL, party-size selection, per-restaurant pages, and a `POST /api/bookings` handler that would have allowed shell-based race testing. `SPEC.md` records the reasoning for each.
