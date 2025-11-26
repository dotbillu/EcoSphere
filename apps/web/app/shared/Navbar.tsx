"use client";

import { House, Map, Network, User, Search } from "lucide-react";
import {
  CurrentPageAtom,
  PageName,
  userAtom,
  totalUnseenConversationsAtom,
} from "@/store";
import { useAtom } from "jotai";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/constants";
import { UserProfile } from "@types";

const fetchProfile = async (username: string): Promise<UserProfile> => {
  const res = await fetch(`${API_BASE_URL}/user/profile/${username}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const stkwidth = 1.5;
  const stksize = 20;

  const [currentPage, setCurrentPage] = useAtom(CurrentPageAtom);
  const [loggedInUser] = useAtom(userAtom);
  
  // 1. Get the unseen count
  const [unseenCount] = useAtom(totalUnseenConversationsAtom);
  // 2. Ref to track previous count for sound trigger logic
  const prevUnseenCountRef = useRef(unseenCount);

  const icons = [
    { name: "House", Icon: House },
    { name: "Map", Icon: Map },
    { name: "Search", Icon: Search },
    { name: "Network", Icon: Network },
    { name: "profile", Icon: User },
  ] as const;

  // 3. Sound Effect Effect
  useEffect(() => {
    // If count INCREASED (new message arrived) and is greater than 0
    if (unseenCount > prevUnseenCountRef.current && unseenCount > 0) {
      // Create a sound file in your public folder named 'notification.mp3'
      const audio = new Audio("/notification.mp3"); 
      audio.volume = 0.5; // Minimal sound volume
      audio.play().catch((err) => console.log("Audio interaction needed:", err));
    }
    // Update ref for next render
    prevUnseenCountRef.current = unseenCount;
  }, [unseenCount]);

  useEffect(() => {
    if (!loggedInUser?.username) return;

    router.prefetch(`/profile/${loggedInUser.username}`);

    queryClient.prefetchQuery({
      queryKey: ["profile", loggedInUser.username],
      queryFn: () => fetchProfile(loggedInUser.username),
      staleTime: 60_000,
    });

    fetch(`${API_BASE_URL}/user/profile/${loggedInUser.username}`).catch(
      () => {},
    );
  }, [loggedInUser, queryClient, router]);

  useEffect(() => {
    const currentPath = (pathname.split("/")[1] || "house").toLowerCase();

    switch (currentPath) {
      case "":
      case "house":
        setCurrentPage("House");
        break;
      case "map":
        setCurrentPage("Map");
        break;
      case "search":
        setCurrentPage("Search");
        break;
      case "network":
        setCurrentPage("Network");
        break;
      case "profile":
        setCurrentPage("profile");
        break;
      default:
        setCurrentPage("House");
    }
  }, [pathname, setCurrentPage]);

  function HandleOnClick(pagename: PageName) {
    setCurrentPage(pagename);

    if (pagename === "profile") {
      if (loggedInUser?.username) {
        router.push(`/profile/${loggedInUser.username}`);
      } else {
        router.push("/profile");
      }
      return;
    }

    if (pagename === "House") {
      router.push("/house");
      return;
    }

    router.push(`/${pagename.toLowerCase()}`);
  }

  return (
    <div className="w-full bg-black">
      <div className="flex justify-around items-center max-w-lg mx-auto h-16 px-2">
        {icons.map(({ name, Icon }) => (
          <div
            key={name}
            onClick={() => HandleOnClick(name)}
            className={`cursor-pointer rounded-xl p-3 transition-colors relative ${
              currentPage === name
                ? "bg-white text-black"
                : "text-white hover:bg-zinc-800"
            }`}
          >
            {/* 4. Notification Badge Logic */}
            {name === "Network" && unseenCount > 0 && (
              <div className="absolute top-2 right-2 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-black">
                {unseenCount > 9 ? "9+" : unseenCount}
              </div>
            )}
            
            <Icon size={stksize} strokeWidth={stkwidth} />
          </div>
        ))}
      </div>
    </div>
  );
}
