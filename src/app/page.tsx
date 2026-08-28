import { RestaurantBrowser } from "@/components/RestaurantBrowser";
import { getCuisines, getRestaurants, getSuburbs } from "@/lib/restaurants";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Tonight&apos;s First Tables
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Queenstown restaurants with a discounted early table tonight.
        </p>
      </header>

      <RestaurantBrowser
        restaurants={getRestaurants()}
        cuisines={getCuisines()}
        suburbs={getSuburbs()}
      />
    </main>
  );
}
