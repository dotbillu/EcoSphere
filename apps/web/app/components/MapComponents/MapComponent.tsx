"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useAtom } from "jotai";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
} from "@react-google-maps/api";
import { useSearchParams, useRouter } from "next/navigation";
import { locationAtom, userAtom } from "../../store";
import { Home, Star, Layers } from "lucide-react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";

import { getImageUrl } from "../../lib/utils";
import { mapOptions } from "./map/mapOptions";
import { MapElement, GigElement } from "./map/MapTypes";
import GigDetailSidebar from "./map/GigDetailSidebar";
import RoomDetailSidebar from "./map/RoomDetailSidebar";
import Lightbox from "./map/Lightbox";
import CreateRoomModal from "./map/CreateRoomModal";
import CreateGigModal from "./map/CreateGigModal";
import { API_BASE_URL } from "@/lib/constants";

// Helper function
const sanitizeCoords = (item: any) => {
  if (!item) return null;
  const lat = parseFloat(item.latitude);
  const lng = parseFloat(item.longitude);
  if (isNaN(lat) || isNaN(lng)) {
    console.warn("Discarding item with invalid coordinates:", item);
    return null;
  }
  return { ...item, latitude: lat, longitude: lng };
};

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
  const [showRooms, setShowRooms] = useState(true);
  const [showGigs, setShowGigs] = useState(true);
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const searchParams = useSearchParams();
  const router = useRouter();
  
  // This ref fixes the "double click" bug
  const initialUrlProcessed = useRef(false);

  if (!apiKey) throw new Error("Google Maps API key missing...");

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  // Icons
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

  // Geolocation
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

  // Fetch Data
  useEffect(() => {
    if (!isLoaded) return;
    const fetchData = async () => {
      try {
        const [roomRes, gigRes] = await Promise.all([
          fetch(`${API_BASE_URL}/map/rooms`),
          fetch(`${API_BASE_URL}/map/gigs`),
        ]);
        const roomsData = await roomRes.json();
        const gigsData = await gigRes.json();
        setRooms(roomsData.map(sanitizeCoords).filter(Boolean));
        setGigs(gigsData.map(sanitizeCoords).filter(Boolean));
      } catch (e) {
        console.error("Failed fetching map data:", e);
      }
    };
    fetchData();
  }, [isLoaded]);

  // Handle selecting item from URL on load
  useEffect(() => {
    if (
      (gigs.length > 0 || rooms.length > 0) &&
      !initialUrlProcessed.current
    ) {
      const gigIdFromUrl = searchParams.get("gigId");
      const roomIdFromUrl = searchParams.get("roomId");

      if (gigIdFromUrl) {
        const gigToSelect = gigs.find(
          (g) => g.id === parseInt(gigIdFromUrl, 10)
        );
        if (gigToSelect) setSelectedGig(gigToSelect);
      } else if (roomIdFromUrl) {
        const roomToSelect = rooms.find(
          (r) => r.id === parseInt(roomIdFromUrl, 10)
        );
        if (roomToSelect) setSelectedRoom(roomToSelect);
      }
      initialUrlProcessed.current = true;
    }
  }, [gigs, rooms, searchParams]);

  // --- ALL HANDLERS ---

  const handleJoinRoom = async (roomId: number) => {
    if (!user) return alert("Login to join rooms");
    try {
      const res = await fetch(`${API_BASE_URL}/map/room/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error("Failed to join room");

      const { room: updatedRoom } = await res.json();
      const sanitizedRoom = sanitizeCoords(updatedRoom) as MapElement;

      setRooms((prev) =>
        prev.map((r) => (r.id === sanitizedRoom.id ? sanitizedRoom : r))
      );
      setSelectedRoom(sanitizedRoom);
    } catch (err) {
      console.error("Error joining room:", err);
    }
  };

  const handleSaveGigEdit = async (
    updatedData: Partial<GigElement> & { roomId?: number | null }
  ) => {
    if (!selectedGig) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/map/gig/${selectedGig.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        }
      );
      if (!res.ok) throw new Error("Failed to update gig");

      const { gig: updatedGig } = await res.json();
      const sanitizedGig = sanitizeCoords(updatedGig) as GigElement;

      setGigs((prev) =>
        prev.map((g) => (g.id === sanitizedGig.id ? sanitizedGig : g))
      );
      setSelectedGig(sanitizedGig);
    } catch (err) {
      console.error("Error saving gig:", err);
    }
  };

  const handleSaveRoomEdit = async (updatedData: {
    name: string;
    description: string;
  }) => {
    if (!selectedRoom) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/map/room/${selectedRoom.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        }
      );
      if (!res.ok) throw new Error("Failed to update room");

      const { room: updatedRoom } = await res.json();
      const sanitizedRoom = sanitizeCoords(updatedRoom) as MapElement;

      setRooms((prev) =>
        prev.map((r) => (r.id === sanitizedRoom.id ? sanitizedRoom : r))
      );
      setSelectedRoom(sanitizedRoom);
    } catch (err) {
      console.error("Error saving room:", err);
    }
  };

  const handleSelectRoomFromSidebar = (room: MapElement) => {
    if (room) {
      setSelectedGig(null);
      setSelectedRoom(room);
      router.push(`/map?roomId=${room.id}`, { scroll: false });
    }
  };

  const handleNavigate = (el: MapElement | GigElement | null) => {
    if (!el) return;
    const { latitude, longitude } = el;
    window.open(
      `http://googleusercontent.com/maps/google.com/0{latitude},${longitude}`,
      "_blank"
    );
  };

  const handleDelete = async (el: MapElement | GigElement | null) => {
    if (!el || !user) return;
    // This check now works for both gigs and rooms
    if (user.id !== el.createdBy?.id)
      return alert("You can delete only your items");
      
    const type = "title" in el ? "gig" : "room";
    if (!window.confirm(`Delete this ${type}?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/map/${type}/${el.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      type === "gig"
        ? setGigs((prev) => prev.filter((g) => g.id !== el.id))
        : setRooms((prev) => prev.filter((r) => r.id !== el.id));

      if (type === "gig") {
        setSelectedGig(null);
      } else {
        setSelectedRoom(null);
      }
      router.push(`/map`, { scroll: false });
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenLightbox = (i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

  const center = useMemo(() => {
    const lat = parseFloat(location.lat as any);
    const lng = parseFloat(location.lng as any);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
    return { lat: 28.4089, lng: 77.3178 }; // Fallback
  }, [location]);

  // Render states
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
    <div className="relative h-full w-full font-inter">
      {/* SIDEBARS */}
      <AnimatePresence>
        {selectedGig && (
          <GigDetailSidebar
            key="gig-sidebar"
            gig={selectedGig}
            currentUserId={user?.id}
            onClose={() => {
              setSelectedGig(null);
              router.push(`/map`, { scroll: false });
            }}
            onNavigate={() => handleNavigate(selectedGig)}
            onDelete={() => handleDelete(selectedGig)}
            onShowLightbox={handleOpenLightbox}
            onSaveEdit={handleSaveGigEdit}
            onSelectRoom={handleSelectRoomFromSidebar}
          />
        )}

        {selectedRoom && (
          <RoomDetailSidebar
            key="room-sidebar"
            room={selectedRoom}
            currentUserId={user?.id}
            onClose={() => {
              setSelectedRoom(null);
              router.push(`/map`, { scroll: false });
            }}
            onNavigate={() => handleNavigate(selectedRoom)}
            onDelete={() => handleDelete(selectedRoom)}
            onJoin={() => handleJoinRoom(selectedRoom.id)}
            onSaveEdit={handleSaveRoomEdit}
          />
        )}
      </AnimatePresence>

      {isLightboxOpen && selectedGig && (
        <Lightbox
          images={selectedGig.imageUrls}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* TOP-RIGHT LAYER TOGGLES */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 rounded-lg bg-zinc-900/80 p-2 backdrop-blur-md border border-zinc-700 shadow-lg">
        <button
          onClick={() => setShowRooms(!showRooms)}
          className={`flex items-center justify-between gap-4 px-3 py-2 rounded-md transition duration-200 ${
            showRooms
              ? "bg-zinc-700 text-emerald-400"
              : "bg-transparent hover:bg-zinc-800 text-zinc-400"
          }`}
        >
          <span className="text-sm font-medium">Rooms</span>
          <Home
            size={18}
            className={showRooms ? "text-emerald-400" : "text-zinc-500"}
          />
        </button>
        <button
          onClick={() => setShowGigs(!showGigs)}
          className={`flex items-center justify-between gap-4 px-3 py-2 rounded-md transition duration-200 ${
            showGigs
              ? "bg-zinc-700 text-amber-400"
              : "bg-transparent hover:bg-zinc-800 text-zinc-400"
          }`}
        >
          <span className="text-sm font-medium">Gigs</span>
          <Star
            size={18}
            className={showGigs ? "text-amber-400" : "text-zinc-500"}
          />
        </button>
      </div>

      {/* TOP-LEFT 'CREATE' BUTTONS */}
      <div className="absolute top-4 left-4 z-20 flex items-center bg-white rounded-xl p-[2px] shadow-xl">
        <button
          onClick={() => setRoomModalOpen(true)}
          className="px-3 py-2 bg-white hover:bg-zinc-100 text-black rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
        >
          <Home size={16} strokeWidth={2} className="text-zinc-700" />
          <span className="text-sm">Create Room</span>
        </button>
        <div className="w-px h-5 bg-zinc-200 mx-[2px]"></div>
        <button
          onClick={() => setGigModalOpen(true)}
          className="px-3 py-2 bg-white hover:bg-zinc-100 text-black rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
        >
          <Star size={16} strokeWidth={2} className="text-zinc-700" />
          <span className="text-sm">Create Gig</span>
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
          router.push(`/map`, { scroll: false });
        }}
      >
        <MarkerF position={center} icon={icons.user} zIndex={2} />

        {showRooms &&
          rooms.map((r) => (
            <MarkerF
              key={`room-${r.id}`}
              position={{ lat: r.latitude, lng: r.longitude }}
              icon={icons.room}
              onClick={() => {
                setSelectedRoom(r);
                setSelectedGig(null);
                router.push(`/map?roomId=${r.id}`, { scroll: false });
              }}
              zIndex={5}
            />
          ))}

        {showGigs &&
          gigs.map((g) => (
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
                router.push(`/map?gigId=${g.id}`, { scroll: false });
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
            const sanitizedRoom = sanitizeCoords(newRoom);
            if (sanitizedRoom) {
              setRooms((p) => [...p, sanitizedRoom as MapElement]);
            }
            setRoomModalOpen(false);
          }}
        />
      )}
      {isGigModalOpen && (
        <CreateGigModal
          location={location}
          onClose={() => setGigModalOpen(false)}
          onSuccess={(newGig) => {
            const sanitizedGig = sanitizeCoords(newGig);
            if (sanitizedGig) {
              setGigs((p) => [...p, sanitizedGig as GigElement]);
            }
            setGigModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
