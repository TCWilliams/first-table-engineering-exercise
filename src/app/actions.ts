"use server";

import { refresh } from "next/cache";

import { claimFirstTable } from "@/lib/bookings/store";
import { getRestaurants } from "@/lib/restaurants";

export type BookingFormState =
  | { status: "idle" }
  | { status: "booked"; restaurantName: string; time: string }
  | { status: "taken" }
  | { status: "error"; message: string };

const ERROR_MESSAGES = {
  invalid_details: "Enter your name and a valid email address.",
  unknown_restaurant: "That restaurant is no longer listed.",
} as const;

export async function bookTable(
  _previousState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const restaurantId = Number(formData.get("restaurantId"));
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");

  const restaurant = getRestaurants().find(
    (candidate) => candidate.id === restaurantId,
  );
  if (restaurant === undefined) {
    return { status: "error", message: ERROR_MESSAGES.unknown_restaurant };
  }

  // Every read this action needs is already resolved above, so the claim runs as a
  // single uninterrupted step. Nothing may be awaited between here and the result:
  // the atomicity of the check-and-write inside claimFirstTable depends on it.
  const result = claimFirstTable(restaurantId, { name, email });

  if (!result.ok) {
    if (result.reason === "already_booked") {
      // This page was rendered before someone else claimed the table, so the rest
      // of it is stale too. Refresh so it stops advertising tables that are gone.
      refresh();
      return { status: "taken" };
    }
    return { status: "error", message: ERROR_MESSAGES[result.reason] };
  }

  refresh();

  return {
    status: "booked",
    restaurantName: restaurant.name,
    time: restaurant.firstTable.time,
  };
}
