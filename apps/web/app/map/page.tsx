"use client";

import dynamic from "next/dynamic";
import SearchBar from "../Components/SearchBar";

const Map = dynamic(() => import("../Components/MapComponents/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center">
      <span className="loading loading-dots loading-lg" />
    </div>
  ),
});

export default function MapPage() {
  return (
    <>
      {/* <div className="relative z-999">  */}
        <SearchBar />
      {/* </div> */}
      <div style={{ height: "100vh", width: "100vw" }}>
        <Map />
      </div>
    </>
  );
}
