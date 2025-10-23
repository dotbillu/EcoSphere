"use client";

import { Activity, LogOut, SunMoon, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function ProfilePageWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return <ProfilePage />;
}

function ProfilePage() {
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Close sidebar/modal if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest("#profile-sidebar") &&
        !target.closest("#profile-button") &&
        !target.closest("#logout-modal")
      ) {
        setShowProfile(false);
        setShowLogoutModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      {/* User button */}
      <UserIcon
        id="profile-button"
        className="fixed right-2 m-3 mt-5 z-50 border border-amber-50 cursor-pointer rounded-2xl bg-white"
        color="black"
        strokeWidth={0.7}
        size={25}
        onClick={() => setShowProfile(!showProfile)}
      />

      {/* Sidebar */}
      {showProfile && !showLogoutModal && (
        <SideBarContent onLogout={() => setShowLogoutModal(true)} />
      )}

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => signOut({ callbackUrl: "/login" })}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}

function Avatar({ src }: { src?: string | null }) {
  if (!src) return <UserIcon size={24} />;
  return (
    <Image
      src={src}
      alt="avatar"
      width={32}
      height={32}
      className="rounded-full border border-gray-300"
    />
  );
}

function SideBarContent({ onLogout }: { onLogout: () => void }) {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  const userName = session?.user?.name || "Guest";
  const userImage = session?.user?.image ?? null;

  const menuItems = [
    {
      label: "Logout",
      icon: LogOut,
      action: onLogout,
      description: "Sign out from your account",
    },
    {
      label: "Change Theme",
      icon: Activity,
      action: () => alert("Theme toggled!"),
      description: "Switch between dark/light mode",
    },
    {
      label: "My Activities",
      icon: SunMoon,
      action: () => alert("Go to My Activities"),
      description: "View your activities",
    },
  ];

  return (
    <div
      id="profile-sidebar"
      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-max h-max bg-white text-black shadow-lg rounded-2xl p-4 transition-all duration-300 z-50"
    >
      {/* User header */}
      <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
        <Avatar src={userImage} />
        <p className="font-bold">{userName}</p>
      </div>

      {/* Menu buttons */}
      <div className="flex flex-col gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="relative group">
              <button
                onClick={item.action}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-2xl cursor-pointer w-full border-transparent transition-colors"
              >
                <Icon size={20} />
                {item.label}
              </button>
              {/* Hover description */}
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {item.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      id="logout-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
    >
      <div className="bg-white p-6 rounded-2xl shadow-lg w-80 text-center">
        <p className="mb-4 font-semibold text-lg text-black">
          Are you sure you want to logout?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded cursor-pointer"
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded cursor-pointer"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

