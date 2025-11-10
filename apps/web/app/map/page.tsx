"use client";

import dynamic from "next/dynamic";
import SearchBar from "@components/SearchBar";

const Map = dynamic(() => import("@components/MapComponents/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <span className="loading loading-dots loading-lg" />
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="relative z-10">
        <SearchBar />
      </div>

      <div className="w-full flex-1">
        <Map />
      </div>
    </div>
  );
}
