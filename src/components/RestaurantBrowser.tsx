"use client";

import { useState } from "react";

import { RestaurantCard } from "@/components/RestaurantCard";
import { filterRestaurants, type Restaurant } from "@/lib/restaurants";

const selectClassName =
  "rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm dark:border-white/[.145]";
const labelClassName = "text-xs uppercase tracking-wide text-zinc-500";

type RestaurantBrowserProps = {
  restaurants: Restaurant[];
  cuisines: string[];
  suburbs: string[];
};

export function RestaurantBrowser({
  restaurants,
  cuisines,
  suburbs,
}: RestaurantBrowserProps) {
  const [cuisine, setCuisine] = useState("");
  const [suburb, setSuburb] = useState("");

  const matches = filterRestaurants(restaurants, { cuisine, suburb });
  const isFiltered = cuisine !== "" || suburb !== "";

  function clearFilters() {
    setCuisine("");
    setSuburb("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="cuisine" className={labelClassName}>
            Cuisine
          </label>
          <select
            id="cuisine"
            value={cuisine}
            onChange={(event) => setCuisine(event.target.value)}
            className={selectClassName}
          >
            <option value="">All cuisines</option>
            {cuisines.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="suburb" className={labelClassName}>
            Suburb
          </label>
          <select
            id="suburb"
            value={suburb}
            onChange={(event) => setSuburb(event.target.value)}
            className={selectClassName}
          >
            <option value="">All suburbs</option>
            {suburbs.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <p
          aria-live="polite"
          className="py-2 text-sm text-zinc-600 dark:text-zinc-400"
        >
          {isFiltered
            ? `${matches.length} of ${restaurants.length} tables match`
            : `${restaurants.length} tables tonight`}
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/[.15] p-10 text-center dark:border-white/[.2]">
          <p className="font-medium">No first tables match those filters.</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Try a different cuisine or suburb.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((restaurant) => (
            <li key={restaurant.id}>
              <RestaurantCard restaurant={restaurant} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
