"use client";
import {
  House,
  Map,
  BotMessageSquare,
  Network,
  User,
} from "lucide-react";
import { CurrentPageAtom, PageName, userAtom, UserProfile } from "../store";
import { useAtom } from "jotai";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/constants";

// CHANGED: Removed hardcoded API URL from the fetchProfile definition
const fetchProfile = async (username: string): Promise<UserProfile> => {
  // CHANGED: Use constant API_BASE_URL
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

  const icons = [
    { name: "House", Icon: House },
    { name: "Map", Icon: Map },
    { name: "CHATAI", Icon: BotMessageSquare },
    { name: "Network", Icon: Network },
    { name: "profile", Icon: User },
  ] as const;

  useEffect(() => {
    if (!loggedInUser?.username) return;
    router.prefetch(`/profile/${loggedInUser.username}`);
    queryClient.prefetchQuery({
      queryKey: ["profile", loggedInUser.username],
      queryFn: () => fetchProfile(loggedInUser.username),
      staleTime: 60_000,
    });
    // CHANGED: Use constant API_BASE_URL
    fetch(`${API_BASE_URL}/user/profile/${loggedInUser.username}`).catch(
      () => {}
    );
  }, [loggedInUser, queryClient, router]);

  useEffect(() => {
    const currentPath = (pathname.split("/")[1] || "house").toLowerCase();
    switch (currentPath) {
      case "house":
      case "":
        setCurrentPage("House");
        break;
      case "map":
        setCurrentPage("Map");
        break;
      case "chatai":
        setCurrentPage("CHATAI");
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
    } else if (pagename === "House") {
      router.push("/house");
    } else {
      router.push(`/${pagename.toLowerCase()}`);
    }
  }

  return (
    <div className="w-full bg-black">
      <div className="flex justify-around items-center max-w-lg mx-auto h-16 px-2">
        {icons.map(({ name, Icon }) => (
          <div
            key={name}
            onClick={() => HandleOnClick(name)}
            className={`cursor-pointer rounded-xl p-3 transition-colors ${
              currentPage === name
                ? "bg-white text-black"
                : "text-white hover:bg-zinc-800"
            }`}
          >
            <Icon size={stksize} strokeWidth={stkwidth} />
          </div>
        ))}
      </div>
    </div>
  );
}
