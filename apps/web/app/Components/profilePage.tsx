"use client";
import { Activity, LogOut, SunMoon, User } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div>
      <User
        className="fixed right-2 m-3 mt-5 z-50 border border-amber-50 cursor-pointer rounded-2xl bg-white"
        color="black"
        strokeWidth={0.7}
        size={25}
        onClick={() => setShowProfile(!showProfile)}
      />
      {showProfile && <SideBarContent />}
    </div>
  );
}

function SideBarContent() {
  const menuItems = [
    { label: "Auth Status", icon: User },
    { label: "Logout", icon: LogOut },
    { label: "Change Theme", icon: Activity },
    { label: "My Activities", icon: SunMoon },
  ];

  function HandleOnClick(lab:string){
alert(lab)
  }
  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-max h-max bg-white text-black shadow-lg rounded-2xl p-2">
      <div className="flex flex-col">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
            onClick={()=>HandleOnClick(item.label)}
              key={item.label}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-2xl cursor-pointer border-transparent"
            >
              <Icon size={20} />
              {item.label}
            
            </button>
          );
        })}
      </div>
    </div>
  );
}
