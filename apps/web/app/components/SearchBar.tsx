"use client";

import { Search, Loader2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import useDebounce from "../hooks/useDebounce";
import SearchResults from "./SearchResults";
import { userAtom } from "../store";
import { API_BASE_URL } from '@/lib/constants'

// --- Types ---
// (You may want to move these to a shared types file)
interface SearchUser {
  id: number;
  name: string;
  username: string;
  image: string | null;
}
interface SearchPost {
  id: number;
  content: string;
  user: { username: string };
}
interface SearchGig {
  id: number;
  title: string;
  createdBy: { username: string };
}
interface SearchRoom {
  id: number;
  name: string;
  createdBy: { username: string };
}

export type SearchResult =
  | { type: "user"; data: SearchUser }
  | { type: "post"; data: SearchPost }
  | { type: "gig"; data: SearchGig }
  | { type: "room"; data: SearchRoom };
// --- End Types ---

// --- Debounce Hook ---
// Create a new file: `hooks/useDebounce.ts`
// import { useState, useEffect } from 'react';
//
// export default function useDebounce(value: string, delay: number) {
//   const [debouncedValue, setDebouncedValue] = useState(value);
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);
//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);
//   return debouncedValue;
// }
// --- End Hook ---

const fetchSearch = async (
  query: string,
  userId: number | undefined,
  followersOnly: boolean,
): Promise<SearchResult[]> => {
  if (query.trim().length < 2) return []; // Don't search for less than 2 chars
  const res = await fetch(
    `${API_BASE_URL}/search?q=${encodeURIComponent(
      query,
    )}&userId=${userId}&followersOnly=${followersOnly}`,
  );
  if (!res.ok) throw new Error("Search failed");
  return res.json();
};

export default function SearchBar() {
  const [user] = useAtom(userAtom);
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [followersOnly, setFollowersOnly] = useState(false);
  const debouncedQuery = useDebounce(query, 300); // 300ms debounce
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery, user?.id, followersOnly],
    queryFn: () => fetchSearch(debouncedQuery, user?.id, followersOnly),
    enabled: debouncedQuery.length > 1, // Only fetch if query is long enough
  });

  const isExpanded = isFocused || query.length > 0;

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
        if (query.length === 0) {
          inputRef.current?.blur();
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [query]);

  return (
    <div
      ref={searchBarRef}
      className="absolute top-3 right-4 mr-10 z-20" // z-20 to be above page content
    >
      <div
        className={`relative flex items-center border rounded-full px-2 py-2 transition-all duration-300 overflow-visible
          ${
            isExpanded
              ? "w-72 bg-white shadow-lg"
              : "w-36 bg-white hover:bg-gray-100"
          }`}
      >
        <Search className="text-gray-500 shrink-0 mx-1" size={20} />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          onFocus={() => setIsFocused(true)}
          className="bg-transparent outline-none w-full placeholder:text-gray-400 text-black text-sm ml-1"
        />
        {query.length > 0 && (
          <button
            onClick={() => setQuery("")}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
      </div>

      {/* --- Search Results Dropdown --- */}
      {isExpanded && (query.length > 1 || results) && (
        <div className="absolute top-full mt-2 w-72">
          {/* "Only Followers" Checkbox */}
          {user && (
            <div className="flex items-center p-2 bg-white rounded-t-lg border-b border-gray-200 shadow-xl">
              <input
                type="checkbox"
                id="followersOnly"
                checked={followersOnly}
                onChange={(e) => setFollowersOnly(e.target.checked)}
                className="form-checkbox h-4 w-4 rounded bg-gray-200 border-gray-400 text-blue-500 focus:ring-blue-500"
              />
              <label
                htmlFor="followersOnly"
                className="ml-2 text-xs text-gray-600"
              >
                Search only people you follow
              </label>
            </div>
          )}

          {/* Results List */}
          <SearchResults
            results={results || []}
            isLoading={isLoading && debouncedQuery.length > 1}
            onClose={() => setIsFocused(false)}
          />
        </div>
      )}
    </div>
  );
}
