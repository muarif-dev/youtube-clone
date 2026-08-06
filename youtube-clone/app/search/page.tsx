import { Suspense } from "react";
import SearchResults from "./SearchResults";
import { SearchResultsSkeleton } from "../components/Skeletons";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-yt-bg px-4 pb-24 pt-6 text-white sm:px-6 md:pb-10 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SearchResultsSkeleton />
          </div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
