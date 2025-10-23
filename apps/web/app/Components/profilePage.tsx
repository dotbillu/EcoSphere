// Components/MapComponent.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { locationAtom } from "../store";

const mapOptions = {
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
  zoomControl: true,
};

export default function MapComponent() {
  const [location, setLocation] = useAtom(locationAtom);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) throw new Error("Google Maps API key is missing...");

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocation({ lat: 28.4089, lng: 77.3178 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === 1) {
          // PERMISSION_DENIED — silently handle it
          setPermissionDenied(true);
        } else {
          // Log only other errors
          console.error(
            "Geolocation error:",
            `code=${error.code}`,
            `message=${error.message}`
          );
          setLocation({ lat: 28.4089, lng: 77.3178 });
        }
      }
    );
  }, [setLocation]);

  const center = useMemo(() => {
    return location.lat && location.lng
      ? { lat: location.lat, lng: location.lng }
      : { lat: 28.4089, lng: 77.3178 };
  }, [location]);

  if (permissionDenied) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white">
        <p className="text-lg font-semibold text-gray-700">
          Allow location to continue
        </p>
      </div>
    );
  }

  if (!isLoaded || !location.lat) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={center}
      zoom={15}
      options={mapOptions}
    >
      <MarkerF position={center} />
    </GoogleMap>
  );
}

