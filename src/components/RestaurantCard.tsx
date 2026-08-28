import type { FirstTable, PartySize, Restaurant } from "@/lib/restaurants";

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

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { name, cuisine, suburb, address, rating, reviewsCount, priceLevel } =
    restaurant;
  const { time, partySize, discount, bookingFee }: Partial<FirstTable> =
    restaurant.firstTable ?? {};

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
    </article>
  );
}
