import { getRestaurants } from "@/lib/restaurants";

export type Diner = {
  name: string;
  email: string;
};

export type Booking = {
  restaurantId: number;
  name: string;
  email: string;
  bookedAt: string;
};

export type ClaimResult =
  | { ok: true; booking: Booking }
  | {
      ok: false;
      reason: "already_booked" | "unknown_restaurant" | "invalid_details";
    };

type BookingStore = {
  restaurantIds: Set<number>;
  bookings: Map<number, Booking>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pinned to globalThis rather than held in a module-level `const`. The dev server
// re-evaluates modules on edit, and the server-action and page module graphs can
// each hold their own instance of this file — either would silently split the
// bookings into two maps that guard nothing.
const globalStore = globalThis as typeof globalThis & {
  __firstTableStore?: BookingStore;
};

function getStore(): BookingStore {
  globalStore.__firstTableStore ??= {
    restaurantIds: new Set(getRestaurants().map((restaurant) => restaurant.id)),
    bookings: new Map(),
  };
  return globalStore.__firstTableStore;
}

function validateDiner(diner: Diner): Diner | null {
  const name = diner.name.trim();
  const email = diner.email.trim();
  if (name === "" || !EMAIL_PATTERN.test(email)) {
    return null;
  }
  return { name, email };
}

export function claimFirstTable(
  restaurantId: number,
  diner: Diner,
): ClaimResult {
  const store = getStore();

  // Validation runs up front, outside the critical section below, so that section
  // stays as short and as obviously synchronous as possible.
  const validated = validateDiner(diner);
  if (validated === null) {
    return { ok: false, reason: "invalid_details" };
  }

  if (!store.restaurantIds.has(restaurantId)) {
    return { ok: false, reason: "unknown_restaurant" };
  }

  // --- critical section: must stay synchronous ---
  // No `await` may appear between this check and the write below. Node guarantees
  // that a synchronous run of code cannot be interleaved, which is the only reason
  // this check-then-act is atomic. Introduce an await here and the event loop is
  // free to run a second request's check before this one writes, so both requests
  // see an available table and two diners end up holding it.
  if (store.bookings.has(restaurantId)) {
    return { ok: false, reason: "already_booked" };
  }

  const booking: Booking = {
    restaurantId,
    name: validated.name,
    email: validated.email,
    bookedAt: new Date().toISOString(),
  };
  store.bookings.set(restaurantId, booking);
  // --- end critical section ---

  return { ok: true, booking };
}

export function getBookedRestaurantIds(): number[] {
  return [...getStore().bookings.keys()];
}
