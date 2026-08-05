import { Suspense } from "react";
import SearchResults from "./SearchResults";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-yt-secondary">Searching...</div>}>
      <SearchResults />
    </Suspense>
  );
}
