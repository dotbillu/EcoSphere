"use client";

import { House, Map, Network, User, Search } from "lucide-react";
import { CurrentPageAtom, PageName, userAtom } from "../store";
import { useAtom } from "jotai";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
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

  const icons = [
    { name: "House", Icon: House },
    { name: "Map", Icon: Map },
    { name: "Search", Icon: Search },
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
