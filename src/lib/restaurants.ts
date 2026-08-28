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
