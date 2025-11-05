"use client";

import { useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import { locationAtom, userAtom } from "../../store";
import { Home, Star } from "lucide-react";
import Image from "next/image";

import { getImageUrl } from "../../lib/utils";
import { mapOptions } from "./map/mapOptions";
import { MapElement, GigElement } from "./map/MapTypes";
import GigDetailSidebar from "./map/GigDetailSidebar";
import RoomDetailSidebar from "./map/RoomDetailSidebar";
import Lightbox from "./map/Lightbox";
import CreateRoomModal from "./map/CreateRoomModal";
import CreateGigModal from "./map/CreateGigModal";

export default function MapComponent() {
  const [user] = useAtom(userAtom);
  const [location, setLocation] = useAtom(locationAtom);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [rooms, setRooms] = useState<MapElement[]>([]);
  const [gigs, setGigs] = useState<GigElement[]>([]);
  const [selectedGig, setSelectedGig] = useState<GigElement | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<MapElement | null>(null);

  const [isRoomModalOpen, setRoomModalOpen] = useState(false);
  const [isGigModalOpen, setGigModalOpen] = useState(false);

  const [joinStatus, setJoinStatus] = useState<Record<number, string>>({});
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!apiKey) throw new Error("Google Maps API key missing...");

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  const icons = useMemo(() => {
    if (!isLoaded) return null;
    return {
      room: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
          ),
        scaledSize: new google.maps.Size(32, 32),
      },
      gig: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#F59E0B" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
          ),
        scaledSize: new google.maps.Size(32, 32),
      },
      user: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#3B82F6" stroke="#FFFFFF" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>'
          ),
        scaledSize: new google.maps.Size(32, 32),
      },
    };
  }, [isLoaded]);

  // --- GEOLOCATION ---
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.log("Geolocation not supported");
      setLocation({ lat: 28.4089, lng: 77.3178 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.error("Geolocation error:", err.message);
        if (err.code === 1) setPermissionDenied(true);
        setLocation({ lat: 28.4089, lng: 77.3178 });
      }
    );
  }, [setLocation]);

  // --- FETCH DATA ---
  useEffect(() => {
    if (!isLoaded) return;
    const fetchData = async () => {
      try {
        const [roomRes, gigRes] = await Promise.all([
          fetch("http://localhost:4000/map/rooms"),
          fetch("http://localhost:4000/map/gigs"),
        ]);
        setRooms(await roomRes.json());
        setGigs(await gigRes.json());
      } catch (e) {
        console.error("Failed fetching map data:", e);
      }
    };
    fetchData();
  }, [isLoaded]);

  // --- HANDLERS ---
  const handleJoinRoom = async (roomId: number) => {
    if (!user) return alert("Login to join rooms");
    setJoinStatus((p) => ({ ...p, [roomId]: "Joining..." }));
    try {
      const res = await fetch(`http://localhost:4000/map/room/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error("Failed to join");
      setJoinStatus((p) => ({ ...p, [roomId]: "Joined" }));
    } catch {
      setJoinStatus((p) => ({ ...p, [roomId]: "Error" }));
    }
  };

  const handleNavigate = (el: MapElement | GigElement | null) => {
    if (!el) return;
    const { latitude, longitude } = el;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      "_blank"
    );
  };

  const handleDelete = async (el: MapElement | GigElement | null) => {
    if (!el || !user) return;
    if (user.id !== el.creatorId) return alert("You can delete only your items");
    const type = "title" in el ? "gig" : "room";
    if (!window.confirm(`Delete this ${type}?`)) return;

    try {
      const res = await fetch(`http://localhost:4000/map/${type}/${el.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      type === "gig"
        ? setGigs((prev) => prev.filter((g) => g.id !== el.id))
        : setRooms((prev) => prev.filter((r) => r.id !== el.id));
      if (type === "gig") setSelectedGig(null);
      else setSelectedRoom(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenLightbox = (i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

  const center = useMemo(
    () =>
      location.lat && location.lng
        ? { lat: location.lat, lng: location.lng }
        : { lat: 28.4089, lng: 77.3178 },
    [location]
  );

  // --- RENDER STATES ---
  if (permissionDenied)
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white">
        Please allow location access
      </div>
    );

  if (!isLoaded || !icons)
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white">
        Loading map...
      </div>
    );

  return (
    <div className="relative h-full w-full">
      {/* SIDEBARS */}
      {selectedGig && (
        <GigDetailSidebar
          gig={selectedGig}
          currentUserId={user?.id}
          onClose={() => setSelectedGig(null)}
          onNavigate={() => handleNavigate(selectedGig)}
          onDelete={() => handleDelete(selectedGig)}
          onShowLightbox={handleOpenLightbox}
        />
      )}

      {selectedRoom && (
        <RoomDetailSidebar
          room={selectedRoom}
          currentUserId={user?.id}
          onClose={() => setSelectedRoom(null)}
          onNavigate={() => handleNavigate(selectedRoom)}
          onDelete={() => handleDelete(selectedRoom)}
          onJoin={() => handleJoinRoom(selectedRoom.id)}
        />
      )}

      {isLightboxOpen && selectedGig && (
        <Lightbox
          images={selectedGig.imageUrls}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* TOP BUTTONS */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={() => setRoomModalOpen(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full shadow-md flex items-center gap-2"
        >
          <Home size={18} /> Create Room
        </button>
        <button
          onClick={() => setGigModalOpen(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-full shadow-md flex items-center gap-2"
        >
          <Star size={18} /> Create Gig
        </button>
      </div>

      {/* GOOGLE MAP */}
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={15}
        options={mapOptions}
        onClick={() => {
          setSelectedGig(null);
          setSelectedRoom(null);
        }}
      >
        {/* User Marker */}
        <MarkerF position={center} icon={icons.user} zIndex={2} />

        {/* Room Markers */}
        {rooms.map((r) => (
          <MarkerF
            key={`room-${r.id}`}
            position={{ lat: r.latitude, lng: r.longitude }}
            icon={icons.room}
            onClick={() => {
              setSelectedRoom(r);
              setSelectedGig(null);
            }}
            zIndex={5}
          />
        ))}

        {/* Gig Markers */}
        {gigs.map((g) => (
          <MarkerF
            key={`gig-${g.id}`}
            position={{ lat: g.latitude, lng: g.longitude }}
            icon={
              g.imageUrls?.[0]
                ? {
                    url: getImageUrl(g.imageUrls[0]),
                    scaledSize: new google.maps.Size(32, 32),
                  }
                : icons.gig
            }
            onClick={() => {
              setSelectedGig(g);
              setSelectedRoom(null);
            }}
            zIndex={5}
          />
        ))}
      </GoogleMap>

      {/* CREATE MODALS */}
      {isRoomModalOpen && (
        <CreateRoomModal
          location={location}
          onClose={() => setRoomModalOpen(false)}
          onSuccess={(newRoom) => {
            setRooms((p) => [...p, newRoom]);
            setRoomModalOpen(false);
          }}
        />
      )}
      {isGigModalOpen && (
        <CreateGigModal
          location={location}
          onClose={() => setGigModalOpen(false)}
          onSuccess={(newGig) => {
            setGigs((p) => [...p, newGig]);
            setGigModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

