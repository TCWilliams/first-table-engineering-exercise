"use client";

import { useActionState } from "react";

import { bookTable, type BookingFormState } from "@/app/actions";
import type { FirstTable, PartySize, Restaurant } from "@/lib/restaurants";

const initialBookingState: BookingFormState = { status: "idle" };

const inputClassName =
  "rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm dark:border-white/[.145]";
const fieldLabelClassName = "text-xs uppercase tracking-wide text-zinc-500";

const bookingFeeFormatter = new Intl.NumberFormat("en-NZ", {
  style: "currency",
  currency: "NZD",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function display(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function formatPartySize(partySize: PartySize | null | undefined): string {
  if (!partySize) {
    return "-";
  }
  const { min, max } = partySize;
  if (min === max) {
    return display(min);
  }
  if (min === null || min === undefined || max === null || max === undefined) {
    return display(min ?? max);
  }
  return `${min}–${max}`;
}

function formatBookingFee(bookingFee: number | null | undefined): string {
  return bookingFee === null || bookingFee === undefined
    ? "-"
    : bookingFeeFormatter.format(bookingFee);
}

type RestaurantCardProps = {
  restaurant: Restaurant;
  isBooked: boolean;
};

export function RestaurantCard({ restaurant, isBooked }: RestaurantCardProps) {
  const { id, name, cuisine, suburb, address, rating, reviewsCount, priceLevel } =
    restaurant;
  const { time, partySize, discount, bookingFee }: Partial<FirstTable> =
    restaurant.firstTable ?? {};

  const [bookingState, bookAction, isBooking] = useActionState(
    bookTable,
    initialBookingState,
  );

  // `isBooked` comes from the server on every render; `taken` covers the moment
  // between this diner submitting and the refreshed page arriving.
  const isUnavailable = isBooked || bookingState.status === "taken";

  return (
    <article className="flex h-full flex-col gap-4 rounded-xl border border-black/[.08] p-5 dark:border-white/[.145]">
      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            {display(name)}
          </h2>
          <span className="shrink-0 text-sm text-zinc-500">
            {display(priceLevel)}
          </span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {display(cuisine)} · {display(suburb)}
        </p>
        <p className="text-sm text-zinc-500">{display(address)}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          ★ {display(rating)} ({display(reviewsCount)} reviews)
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 border-t border-black/[.08] pt-4 text-sm dark:border-white/[.145]">
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Time</dt>
          <dd className="font-medium">{display(time)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Party size</dt>
          <dd className="font-medium">{formatPartySize(partySize)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Discount</dt>
          <dd className="font-medium">{display(discount)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Booking fee</dt>
          <dd className="font-medium">{formatBookingFee(bookingFee)}</dd>
        </div>
      </dl>

      {bookingState.status === "booked" ? (
        <p
          role="status"
          className="mt-auto rounded-lg border border-green-600/30 bg-green-600/10 p-3 text-sm"
        >
          Booked — {bookingState.restaurantName} at {bookingState.time}. A
          confirmation is on its way.
        </p>
      ) : isUnavailable ? (
        <div className="mt-auto rounded-lg border border-black/[.08] p-3 text-sm dark:border-white/[.145]">
          <p className="font-medium">This first table is already booked.</p>
          {bookingState.status === "taken" && (
            <p role="alert" className="mt-1 text-zinc-600 dark:text-zinc-400">
              Sorry — it was just taken by another diner.
            </p>
          )}
        </div>
      ) : (
        // noValidate: the server is the authority on what counts as valid, and
        // browser constraint validation would stop bad input ever reaching it.
        <form action={bookAction} noValidate className="mt-auto flex flex-col gap-3">
          <input type="hidden" name="restaurantId" value={id} />

          <div className="flex flex-col gap-1">
            <label htmlFor={`name-${id}`} className={fieldLabelClassName}>
              Name
            </label>
            <input
              id={`name-${id}`}
              name="name"
              type="text"
              required
              autoComplete="name"
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`email-${id}`} className={fieldLabelClassName}>
              Email
            </label>
            <input
              id={`email-${id}`}
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClassName}
            />
          </div>

          {bookingState.status === "error" && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {bookingState.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isBooking}
            className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-white/[.06]"
          >
            {isBooking ? "Booking…" : "Book this table"}
          </button>
        </form>
      )}
    </article>
  );
}
