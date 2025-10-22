// Components/MapComponent.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { locationAtom } from "../store";

// CORRECTED: Set controls to 'true' to make them visible
const mapOptions = {
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
  zoomControl: true, // This one is usually on by default
};

export default function MapComponent() {
  const [location, setLocation] = useAtom(locationAtom);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API key is missing...");
  }

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  // The rest of your component code is perfect, no changes needed below this line
  // ... (useEffect, useMemo, etc.)

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          setLocation({ lat: 28.4089, lng: 77.3178 });
        }
      );
    } else {
      console.log("Geolocation not supported.");
      setLocation({ lat: 28.4089, lng: 77.3178 });
    }
  }, [setLocation]);

  const center = useMemo(() => {
    return (location.lat && location.lng)
      ? { lat: location.lat, lng: location.lng }
      : { lat: 28.4089, lng: 77.3178 };
  }, [location]);

  if (!isLoaded || !location.lat) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={center}
      zoom={15}
      options={mapOptions} // This now enables the buttons
    >
      <MarkerF position={center} />
    </GoogleMap>
  );
}
