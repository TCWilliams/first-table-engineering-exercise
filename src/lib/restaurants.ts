import data from "@/data/restaurants.json";

export type PartySize = {
  min: number;
  max: number;
};

export type FirstTable = {
  time: string;
  partySize: PartySize;
  discount: string;
  bookingFee: number;
};

export type Restaurant = {
  id: number;
  name: string;
  cuisine: string;
  suburb: string;
  address: string;
  rating: number;
  reviewsCount: number;
  priceLevel: string;
  firstTable: FirstTable;
};

export type RestaurantFilters = {
  cuisine: string;
  suburb: string;
};

const restaurants: Restaurant[] = data.restaurants;

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function getRestaurants(): Restaurant[] {
  return [...restaurants];
}

export function getCuisines(): string[] {
  return sortedUnique(restaurants.map((restaurant) => restaurant.cuisine));
}

export function getSuburbs(): string[] {
  return sortedUnique(restaurants.map((restaurant) => restaurant.suburb));
}

// An empty filter value means "no filter applied". Using "" rather than a label
// like "All" keeps the sentinel from ever colliding with a real cuisine or suburb.
export function filterRestaurants(
  list: Restaurant[],
  { cuisine, suburb }: RestaurantFilters,
): Restaurant[] {
  return list.filter(
    (restaurant) =>
      (cuisine === "" || restaurant.cuisine === cuisine) &&
      (suburb === "" || restaurant.suburb === suburb),
  );
}
