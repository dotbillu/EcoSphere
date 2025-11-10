"use client";
import {
  Activity,
  BotMessageSquare,
  House,
  Map,
  Network,
  Search,
  Settings,
  User,
} from "lucide-react";
import { CurrentPageAtom, PageName, userAtom, UserProfile } from "../store";
import { useAtom } from "jotai";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const fetchProfile = async (username: string): Promise<UserProfile> => {
  const res = await fetch(`http://127.0.0.1:4000/user/profile/${username}`); // <- faster than localhost in dev
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const stkwidth = 1;
  const stksize = 14;
  const [currentPage, setCurrentPage] = useAtom(CurrentPageAtom);
  const [loggedInUser] = useAtom(userAtom);

  const icons = [
    { name: "House", Icon: House },
    { name: "Map", Icon: Map },
    { name: "CHATAI", Icon: BotMessageSquare },
    { name: "Network", Icon: Network },
    { name: "profile", Icon: User },
  ] as const;

  // *** PERF PREFETCH ***
  useEffect(() => {
    if (!loggedInUser?.username) return;

    // prefetch bundle
    router.prefetch(`/profile/${loggedInUser.username}`);

    // prefetch data to react-query cache
    queryClient.prefetchQuery({
      queryKey: ["profile", loggedInUser.username],
      queryFn: () => fetchProfile(loggedInUser.username),
      staleTime: 60_000,
    });

    // warm network connection itself
    fetch(`http://127.0.0.1:4000/user/profile/${loggedInUser.username}`).catch(() => {});
  }, [loggedInUser, queryClient, router]);

  // sync active icon
  useEffect(() => {
    const currentPath = (pathname.split("/")[1] || "house").toLowerCase();
    switch (currentPath) {
      case "house":
      case "":
        setCurrentPage("House"); break;
      case "map":
        setCurrentPage("Map"); break;
      case "chatai":
        setCurrentPage("CHATAI"); break;
      case "network":
        setCurrentPage("Network"); break;
      case "profile":
        setCurrentPage("profile"); break;
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
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md px-4 z-top">
      <div className="flex justify-between bg-white rounded-xl text-white p-[2px]">
        {icons.map(({ name, Icon }) => (
          <div
            key={name}
            onClick={() => HandleOnClick(name)}
            className={`cursor-pointer rounded-xl p-2 px-3 mx-[2px] border-[1px] border-transparent active-border-white 
              ${currentPage === name ? "bg-[#242426] text-white" : "hover:bg-zinc-100 text-black"}`}
          >
            <Icon size={stksize} strokeWidth={stkwidth} />
          </div>
        ))}
      </div>
    </div>
  );
}

