"use client";
import { Activity, BotMessageSquare, House, Map, Network, Search, Settings, User } from "lucide-react";
import { CurrentPageAtom, PageName } from "../store";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const stkwidth = 1;
  const stksize = 14;
  const [currentPage, setCurrentPage] = useAtom(CurrentPageAtom);

  const icons = [
    { name: "House", Icon: House },
    { name: "Map", Icon: Map },
    { name: "CHATAI", Icon: BotMessageSquare },
    { name: "Network", Icon: Network },
    { name: "profile", Icon: User },
  ] as const;
  function HandleOnClick(pagename: PageName) {
    setCurrentPage(pagename);
    router.push(`/${pagename.toLowerCase()}`);
  }
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50  max-w-md px-4 z-top">
      <div className="flex justify-between bg-white rounded-xl text-white p-[2px]">
        {icons.map(({ name, Icon }) => (
          <div
            key={name}
            onClick={() => HandleOnClick(name)}
            className={`cursor-pointer rounded-xl p-2 px-3 mx-[2px] border-[1px] border-transparent active-border-white 
              ${
                currentPage === name
                  ? "bg-[#242426] text-white"
                  : "hover:bg-zinc-100 text-black"
              }`}
          >
            <Icon size={stksize} strokeWidth={stkwidth} />
          </div>
        ))}
      </div>
    </div>
  );
}
