// Components/MapComponent.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import { locationAtom, userAtom, MapRoom, Gig, User } from "../store"; // Import new types and userAtom
import CreateRoomModal from "./CreateRoomModal"; // Import new modal
import CreateGigModal from "./CreateGigModal"; // Import new modal
import { Home, Star, User as UserIcon, Trash2, Navigation } from "lucide-react";
// --- MODIFICATION ---
// Import the getImageUrl helper
import { getImageUrl } from "../lib/utils";
import Image from "next/image"; // Import Next's Image component

// Map options
const mapOptions: google.maps.MapOptions = {
  streetViewControl: false,
  mapTypeControl: false, // Hide Satellite/Map toggle
  fullscreenControl: false,
  zoomControl: false,
  styles: [
    // Add a simple dark-mode style for the map
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    // --- MODIFICATION: Hide POIs, businesses, transit labels, etc. ---
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.business",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative.land_parcel",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "administrative.neighborhood",
      stylers: [{ visibility: "off" }],
    },
    // --- End of POI styles ---
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ],
};

// --- MODIFICATION ---
// We need to add `creatorId` to our local types for the delete button to work.
// Make sure your backend `GET /map/rooms` and `GET /map/gigs` routes `select` this!
interface MapElement extends MapRoom {
  creatorId?: number;
}
interface GigElement extends Gig {
  creatorId?: number;
}

export default function MapComponent() {
  const [user] = useAtom(userAtom);
  const [location, setLocation] = useAtom(locationAtom);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // --- MODIFICATION: Use new types ---
  const [rooms, setRooms] = useState<MapElement[]>([]);
  const [gigs, setGigs] = useState<GigElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<
    MapElement | GigElement | null
  >(null);
  // ---
  const [isRoomModalOpen, setRoomModalOpen] = useState(false);
  const [isGigModalOpen, setGigModalOpen] = useState(false);
  const [joinStatus, setJoinStatus] = useState<Record<number, string>>({});

  if (!apiKey) throw new Error("Google Maps API key is missing...");

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
            '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
          ),
        scaledSize: new google.maps.Size(32, 32),
      },
      // This is the fallback gig icon (yellow star)
      gig: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
          ),
        scaledSize: new google.maps.Size(32, 32),
      },
      user: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#3B82F6" stroke="#FFFFFF" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>'
          ),
        // --- MODIFICATION: Made user icon smaller ---
        scaledSize: new google.maps.Size(32, 32),
      },
    };
  }, [isLoaded]);

  // --- GEOLOCATION EFFECT (unchanged) ---
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.log("Geolocation not supported");
      setLocation({ lat: 28.4089, lng: 77.3178 }); // Default
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
        console.error("Geolocation error:", error.message);
        if (error.code === 1) setPermissionDenied(true);
        setLocation({ lat: 28.4089, lng: 77.3178 }); // Default
      }
    );
  }, [setLocation]);

  // --- DATA FETCHING EFFECT (unchanged) ---
  useEffect(() => {
    if (!isLoaded) return;
    // --- MODIFICATION: Add a comment reminding to update backend
    // TODO: Make sure your backend routes GET /map/rooms and GET /map/gigs
    // `select` the `creatorId` for the delete button to work!
    const fetchRooms = async () => {
      try {
        const res = await fetch("http://localhost:4000/map/rooms");
        const data = await res.json();
        setRooms(data);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    };
    const fetchGigs = async () => {
      try {
        const res = await fetch("http://localhost:4000/map/gigs");
        const data = await res.json();
        setGigs(data);
      } catch (err) {
        console.error("Failed to fetch gigs:", err);
      }
    };
    fetchRooms();
    fetchGigs();
  }, [isLoaded]);

  // --- HANDLER TO JOIN A ROOM (unchanged) ---
  const handleJoinRoom = async (roomId: number) => {
    if (!user) {
      alert("You must be logged in to join a room.");
      return;
    }
    setJoinStatus((prev) => ({ ...prev, [roomId]: "Joining..." }));
    try {
      const res = await fetch(`http://localhost:4000/map/room/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error("Failed to join room");
      const data = await res.json();
      console.log(data.message);
      setJoinStatus((prev) => ({ ...prev, [roomId]: "Joined!" }));
    } catch (err) {
      console.error(err);
      setJoinStatus((prev) => ({ ...prev, [roomId]: "Error" }));
    }
  };

  // --- MODIFICATION: Add Navigation Handler ---
  const handleNavigate = () => {
    if (!selectedElement) return;
    const { latitude, longitude } = selectedElement;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, "_blank");
  };

  // --- MODIFICATION: Add Delete Handler ---
  const handleDelete = async () => {
    if (!selectedElement || !user) return;
    if (user.id !== selectedElement.creatorId) {
      alert("You can only delete items you created.");
      return;
    }

    const isGig = "title" in selectedElement;
    const type = isGig ? "gig" : "room";
    const id = selectedElement.id;

    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    // TODO: You need to create these DELETE routes in your backend
    // e.g., DELETE /map/gig/:id and DELETE /map/room/:id
    try {
      const res = await fetch(`http://localhost:4000/map/${type}/${id}`, {
        method: "DELETE",
        // You might need to send auth headers here in the future
      });

      if (!res.ok) throw new Error(`Failed to delete ${type}`);

      // Remove from state on success
      if (isGig) {
        setGigs((prev) => prev.filter((g) => g.id !== id));
      } else {
        setRooms((prev) => prev.filter((r) => r.id !== id));
      }
      setSelectedElement(null);
    } catch (err) {
      console.error(err);
      alert(`Error deleting ${type}. (Have you created the DELETE route?)`);
    }
  };

  const center = useMemo(() => {
    return location.lat && location.lng
      ? { lat: location.lat, lng: location.lng }
      : { lat: 28.4089, lng: 77.3178 }; // Default center
  }, [location]);

  if (permissionDenied) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white">
        <p className="text-lg font-semibold">Please allow location access to use the map.</p>
      </div>
    );
  }

  if (!isLoaded || !location.lat || !icons) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-900">
        <span className="text-white">Loading Map...</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* --- FLOATING ACTION BUTTONS (unchanged) --- */}
      <div className="absolute top-4 right-4 z-10 space-x-2">
        <button
          onClick={() => setRoomModalOpen(true)}
          className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-full shadow-lg hover:bg-emerald-600 flex items-center gap-2"
        >
          <Home size={18} /> Create Room
        </button>
        <button
          onClick={() => setGigModalOpen(true)}
          className="px-4 py-2 bg-amber-500 text-white font-bold rounded-full shadow-lg hover:bg-amber-600 flex items-center gap-2"
        >
          <Star size={18} /> Create Gig
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={15}
        options={mapOptions}
        // --- MODIFICATION: Close InfoWindow when map is clicked ---
        onClick={() => setSelectedElement(null)}
      >
        {/* --- 1. USER'S LOCATION MARKER --- */}
        <MarkerF
          position={center}
          icon={icons.user}
          // --- MODIFICATION: Lower zIndex so it's *below* other markers ---
          zIndex={1}
        />

        {/* --- 2. ROOM MARKERS --- */}
        {rooms.map((room) => (
          <MarkerF
            key={`room-${room.id}`}
            position={{ lat: room.latitude, lng: room.longitude }}
            icon={icons.room}
            onClick={() => setSelectedElement(room)}
            // --- MODIFICATION: Set zIndex to be clickable ---
            zIndex={5}
          />
        ))}

        {/* --- 3. GIG MARKERS --- */}
        {gigs.map((gig) => (
          <MarkerF
            key={`gig-${gig.id}`}
            position={{ lat: gig.latitude, lng: gig.longitude }}
            // --- MODIFICATION: Use uploaded image as icon, or fallback to star ---
            icon={
              gig.imageUrls && gig.imageUrls[0]
                ? {
                    url: getImageUrl(gig.imageUrls[0]),
                    scaledSize: new google.maps.Size(32, 32),
                    anchor: new google.maps.Point(16, 16),
                  }
                : icons.gig
            }
            onClick={() => setSelectedElement(gig)}
            // --- MODIFICATION: Set zIndex to be clickable ---
            zIndex={5}
          />
        ))}

        {/* --- 4. INFO WINDOW (shows for selected element) --- */}
        {selectedElement && (
          <InfoWindowF
            position={{
              lat: selectedElement.latitude,
              lng: selectedElement.longitude,
            }}
            onCloseClick={() => setSelectedElement(null)}
          >
            {/* --- MODIFICATION: Updated InfoWindow Content --- */}
            <div className="p-1 bg-white text-black max-w-xs w-64">
              {"title" in selectedElement ? (
                // --- GIG INFO WINDOW ---
                <div>
                  {selectedElement.imageUrls &&
                    selectedElement.imageUrls[0] && (
                      <div className="relative w-full h-32 rounded-t-lg overflow-hidden">
                        <Image
                          src={getImageUrl(selectedElement.imageUrls[0])}
                          alt={selectedElement.title}
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                    )}
                  <div className="p-2">
                    <h3 className="font-bold text-base text-amber-600 truncate">
                      <Star size={14} className="inline-block mr-1" />
                      {selectedElement.title}
                    </h3>
                    <p className="text-sm text-zinc-700 mt-1 line-clamp-2">
                      {selectedElement.description}
                    </p>
                    {selectedElement.date && (
                      <p className="text-xs text-zinc-500 mt-2">
                        {new Date(selectedElement.date).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                // --- ROOM INFO WINDOW ---
                <div>
                  {selectedElement.imageUrl && (
                    <div className="relative w-full h-32 rounded-t-lg overflow-hidden">
                      <Image
                        src={getImageUrl(selectedElement.imageUrl)}
                        alt={selectedElement.name}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  )}
                  <div className="p-2">
                    <h3 className="font-bold text-base text-emerald-600 truncate">
                      <Home size={14} className="inline-block mr-1" />
                      {selectedElement.name}
                    </h3>
                    <p className="text-sm text-zinc-700 mt-1 line-clamp-2">
                      {selectedElement.description}
                    </p>
                    <button
                      onClick={() => handleJoinRoom(selectedElement.id)}
                      disabled={!!joinStatus[selectedElement.id]}
                      className="mt-3 w-full px-3 py-1.5 bg-emerald-500 text-white text-sm font-bold rounded hover:bg-emerald-600 disabled:bg-zinc-400"
                    >
                      {joinStatus[selectedElement.id] || "Join Room"}
                    </button>
                  </div>
                </div>
              )}
              {/* --- MODIFICATION: Add Navigate and Delete Buttons --- */}
              <div className="flex gap-1 p-2 border-t border-zinc-200">
                <button
                  onClick={handleNavigate}
                  className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-sm font-bold rounded hover:bg-blue-600 flex items-center justify-center gap-1.5"
                >
                  <Navigation size={14} /> Navigate
                </button>
                {user && user.id === selectedElement.creatorId && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded hover:bg-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* --- 5. MODALS (unchanged) --- */}
      {isRoomModalOpen && (
        <CreateRoomModal
          location={location}
          onClose={() => setRoomModalOpen(false)}
          onSuccess={(newRoom) => {
            setRooms((prev) => [...prev, newRoom]);
            setRoomModalOpen(false);
          }}
        />
      )}

      {isGigModalOpen && (
        <CreateGigModal
          location={location}
          onClose={() => setGigModalOpen(false)}
          onSuccess={(newGig) => {
            setGigs((prev) => [...prev, newGig]);
            setGigModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
