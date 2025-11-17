"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import useDebounce from "@/hooks/useDebounce";
import { Search, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { SearchResult, SearchUser, SearchGig, SearchRoom } from "@/lib/types"; // Make sure types are correct
import UserResultCard from "./components/UserResultCard";
import GigResultCard from "./components/GigResultCard";
import RoomResultCard from "./components/RoomResultCard";

type SearchPageResult = {
  results: SearchResult[];
  nextSkip: number | null;
};

type TabType = "all" | "people" | "gigs" | "rooms";

const fetchPageSearch = async (
  query: string,
  tab: TabType,
  skip: number = 0
): Promise<SearchPageResult> => {
  if (query.trim().length < 2) return { results: [], nextSkip: null };
  const res = await fetch(
    `${API_BASE_URL}/search/page?q=${encodeURIComponent(
      query
    )}&tab=${tab}&skip=${skip}&take=10`
  );
  if (!res.ok) throw new Error("Search failed");
  return res.json();
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const debouncedQuery = useDebounce(query, 300);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["search-page", debouncedQuery, activeTab],
    queryFn: ({ pageParam = 0 }) =>
      fetchPageSearch(debouncedQuery, activeTab, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextSkip,
    initialPageParam: 0,
    enabled: debouncedQuery.length > 1,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const allResults = data?.pages.flatMap((page) => page.results) || [];

  return (
    <div className="flex-grow flex flex-col bg-black text-white min-h-full">
      {/* 1. Search Bar Header */}
      <form
        onSubmit={handleSearchSubmit}
        className="sticky top-0 z-10 p-4 bg-black border-b border-zinc-800"
      >
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-12 pr-4 py-3 bg-zinc-900 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        </div>
      </form>

      {/* 2. Tabs */}
      <div className="flex sticky top-[81px] z-10 bg-black border-b border-zinc-800">
        {(["all", "people", "gigs", "rooms"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-center font-semibold transition-colors
              ${
                activeTab === tab
                  ? "text-white border-b-2 border-indigo-500"
                  : "text-zinc-500 hover:bg-zinc-900"
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* 3. Results List */}
      <div className="flex-grow">
        {isLoading && (
          <div className="flex justify-center items-center p-10">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        )}

        {!isLoading && allResults.length === 0 && debouncedQuery && (
          <div className="p-10 text-center text-zinc-400">
            <h3 className="font-bold text-lg text-white">No results for "{query}"</h3>
            <p>Try searching for something else.</p>
          </div>
        )}

        <div className="divide-y divide-zinc-800">
          {allResults.map((item, index) => {
            switch (item.type) {
              case "user":
                return <UserResultCard key={item.data.id} user={item.data as SearchUser} />;
              case "gig":
                return <GigResultCard key={item.data.id} gig={item.data as SearchGig} />;
              case "room":
                return <RoomResultCard key={item.data.id} room={item.data as SearchRoom} />;
              // Add PostResultCard if you want posts on the "all" tab
              default:
                return null;
            }
          })}
        </div>

        {hasNextPage && (
          <div className="flex justify-center p-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-4 py-2 bg-indigo-600 rounded-full hover:bg-indigo-700 disabled:opacity-50"
            >
              {isFetchingNextPage ? "Loading more..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
