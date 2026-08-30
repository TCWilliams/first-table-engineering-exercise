# Task List: Tonight's First Tables

Implements `SPEC.md`. Plan and risks in `tasks/plan.md`. Work top to bottom; stop at each checkpoint.

Every task also clears the Definition of Done in `tasks/plan.md`.

---

## Phase 1: Foundation and Browse

## Task 1: Seed data, domain types, loader

**Description:** Transcribe the 10 restaurants from the brief into a JSON file, define the domain types, and expose a typed loader plus the derived filter option lists. Nothing renders yet — this is the foundation every later task reads from.

**Acceptance criteria:**
- [x] `src/data/restaurants.json` contains all 10 records verbatim from the brief, including `generatedFor`, `date`, and `currency`
- [x] `Restaurant`, `FirstTable`, and `PartySize` types match the JSON shape exactly, with no `any`
- [x] `getRestaurants()`, `getCuisines()`, and `getSuburbs()` are exported; the option lists are deduplicated and sorted

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint succeeds: `npm run lint`
- [x] Manual check: the JSON has exactly 10 entries with ids 101–110, and rating/reviewsCount/bookingFee values match the brief

**Dependencies:** None

**Files likely touched:**
- `src/data/restaurants.json`
- `src/lib/restaurants.ts`

**Estimated scope:** Small (2 files, ~8 min)

---

## Task 2: Browse — render all 10 first tables

**Description:** Replace the create-next-app boilerplate with the real page: a Server Component that loads restaurants and renders them as a card grid. No filtering, no booking — just the full list, correct and readable.

**Acceptance criteria:**
- [x] `/` renders all 10 restaurants as cards showing name, cuisine, suburb, rating, review count, price level, first-table time, party size range, discount, and booking fee (Success Criterion 1)
- [x] Booking fee renders as NZD currency; party size renders as a range, collapsing to a single value when min equals max (id 105 is min 2 / max 2)
- [x] All boilerplate is gone — no Next.js logo, no template copy — and page metadata says something real instead of "Create Next App"

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint succeeds: `npm run lint`
- [x] Manual check: `npm run dev`, load `/`, count 10 cards and spot-check "Arrowtown Alpine Bistro" against the brief field by field

**Dependencies:** Task 1

**Files likely touched:**
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/components/RestaurantCard.tsx`

**Estimated scope:** Medium (3 files, ~12 min)

---

### Checkpoint A: Browse
- [x] `npm run build` and `npm run lint` both clean
- [x] All 10 restaurants render with every required field
- [x] No boilerplate remains

---

## Phase 2: Filter

## Task 3: Filter by cuisine and suburb

**Description:** Add a client component owning the filter state, with two selects driven by the derived option lists. Cards move inside it. Includes the match count and the empty state, both of which are on the cut list if time runs short.

**Acceptance criteria:**
- [x] Cuisine and suburb selects both default to "All", derive options from the data, and combine as AND (Success Criterion 2)
- [x] A match count reflects the filtered result
- [x] A combination matching nothing shows an empty state with a way back to unfiltered, not a blank grid

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint succeeds: `npm run lint`
- [ ] Manual check: cuisine "Japanese" alone gives 1 (Lakeview Ramen Co.); suburb "Queenstown Central" alone gives 4; "Japanese" + "Frankton" together gives 0 and shows the empty state — **awaiting human click-through; expected counts confirmed against the data**

**Dependencies:** Task 2

**Files likely touched:**
- `src/components/RestaurantBrowser.tsx`
- `src/app/page.tsx`
- `src/lib/restaurants.ts`

**Estimated scope:** Medium (3 files, ~8 min)

---

### Checkpoint B: Filter
- [ ] Each filter works alone and the two combine
- [ ] Defaults are "All"; options are derived and deduplicated
- [ ] Empty state appears for a zero-match combination
- [ ] Match count is accurate

---

## Phase 3: Booking and the Guard

## Task 4: Booking store and `claimFirstTable`

**Description:** The heart of the hard requirement. A `globalThis`-pinned store holding bookings by restaurant id, with a single synchronous mutating function. No UI, no Server Action — just the module. Written once, correctly, because the guard is structural rather than something layered on afterwards.

**Acceptance criteria:**
- [x] `claimFirstTable(restaurantId, diner)` is a plain non-`async` function with **no `await` between the availability check and the write**, carrying the comment explaining why
- [x] It returns the `ClaimResult` discriminated union from `SPEC.md`, covering `already_booked`, `unknown_restaurant`, and `invalid_details`
- [x] The store is pinned to `globalThis` so it survives HMR, and an availability reader is exported for the page

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint succeeds: `npm run lint`
- [x] Manual check: read the function top to bottom and confirm the check and the write sit in one unbroken synchronous run; confirm `claimFirstTable` is the only exported function that mutates state

**Dependencies:** Task 1

**Files likely touched:**
- `src/lib/bookings/store.ts`

**Estimated scope:** Small (1 file, ~7 min)

---

## Task 5: Book a table (happy path)

**Description:** Wire the Server Action to the card. A diner enters name and email, submits, and sees a confirmation. Server-side validation included; the rejection paths are Task 6.

**Acceptance criteria:**
- [x] Submitting a valid name and email books the table and shows an inline confirmation naming the restaurant and time, with no full page reload (Success Criterion 3)
- [x] The submit button is disabled while the action is in flight, via `pending` from `useActionState` (Success Criterion 5)
- [x] Blank name or malformed email is rejected server-side with a visible message and creates no booking (Success Criterion 7)

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint succeeds: `npm run lint`
- [x] Manual check: book "Wakatipu Wok", confirm the message names the restaurant and 17:00; submit a blank name and a malformed email and confirm both are refused; double-click submit on a fresh table and confirm only one confirmation appears — **verified by human; claim succeeds and a repeat attempt is rejected server-side**

**Dependencies:** Tasks 3, 4

**Files likely touched:**
- `src/app/actions.ts`
- `src/components/RestaurantCard.tsx`
- `src/app/page.tsx`

**Estimated scope:** Medium (3 files, ~15 min)

---

## Task 6: Double-booking guard surfaced in the UI

**Description:** The rule is already enforced by Task 4 — this task makes it visible. Availability flows into the page, booked cards render as unavailable, a rejected claim shows a human message, and the page refreshes after a successful claim so nobody sees stale availability.

**Acceptance criteria:**
- [x] A booked table renders unavailable in the same interaction, without a manual refresh (Success Criterion 4)
- [x] An attempt on an already-taken table from a stale page shows a clear "just been taken" message, never a confirmation, and flips the card to booked (Success Criterion 6)
- [x] The page renders dynamically, so a booked table is still booked after a hard refresh — build output reports `ƒ /` (dynamic) rather than `○ /` (static)

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint succeeds: `npm run lint`
- [x] Manual check: restart the dev server, then run all five steps of the two-tab walkthrough in `SPEC.md`; hard-refresh both windows afterwards and confirm the table is still booked — **verified by human**

**Dependencies:** Task 5

**Files likely touched:**
- `src/app/page.tsx`
- `src/components/RestaurantCard.tsx`
- `src/lib/bookings/store.ts`

**Estimated scope:** Small (3 files, ~5 min)

---

### Checkpoint C: The Guard — human review gate — **PASSED**
- [x] `claimFirstTable` read line by line: no `await` between check and write
- [x] No code path writes a booking except through `claimFirstTable` — `rg` finds one `bookings.set` in `src/`
- [x] Dev server restarted, then the full five-step two-tab walkthrough passes — steps 1–4 verified at this checkpoint, step 5 (double-click) verified during Task 5
- [x] Booked state survives a hard refresh
- [x] Blank name and malformed email both rejected server-side, no booking created — verified during Task 5
- [x] `npm run build` clean
- [x] **Stop here for human review before Phase 4**

---

## Phase 4: Close-out

## Task 7: Polish — **CUT (time)**

Cut by decision after Checkpoint C passed, which is the cut order the plan specified. No behaviour is affected: a booked card still replaces its form with "This first table is already booked", it just isn't styled to read as booked at a glance. Carried into `SPEC.md` Deferred.

**Description:** First thing cut if the hour is gone. Visual tidy-up only — no new behaviour, nothing from the Deferred list.

**Acceptance criteria:**
- [ ] ~~Booked cards are visually distinct at a glance, not just missing a button~~
- [ ] ~~Layout is coherent on a narrow viewport~~
- [ ] ~~Filter controls, match count, and empty state are visually consistent with the cards~~

**Dependencies:** Task 6

**Files touched:** none — cut

**Estimated scope:** Small (3 files, ~5 min)

---

## Task 8: Reflection and spec reconciliation

**Description:** Write the reflection the brief asks for, and reconcile the spec with what was actually built so the two don't drift.

**Acceptance criteria:**
- [x] `REFLECTION.md` covers what to do next with more time, where the agent went wrong and the response, and what was written or fixed by hand (5–10 sentences per the brief)
- [x] It states the concurrency argument and its one-process limit, plus the database `UNIQUE` constraint as the production answer
- [x] `SPEC.md` status line no longer says "awaiting review", and anything built differently from the spec is reconciled

**Verification:**
- [x] Manual check: every one of the nine Success Criteria in `SPEC.md` is either demonstrably met or explicitly named as cut in the reflection

**Dependencies:** Task 6 (Task 7 cut)

**Files likely touched:**
- `REFLECTION.md`
- `SPEC.md`

**Estimated scope:** Small (2 files, ~7 min)

---

### Checkpoint D: Complete
- [x] All nine Success Criteria met or explicitly named as cut
- [x] `npm run build` and `npm run lint` clean
- [x] `REFLECTION.md` written
- [x] `SPEC.md` reconciled

---

## Cut Order

If time runs out, drop in this order: Task 7 first, then Task 3's match count and empty state. **Tasks 4, 6, and 8 are never cut** — the guard is the hard requirement and the reflection is a deliverable of the brief.
