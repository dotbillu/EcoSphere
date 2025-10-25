"use client";

import { useAtom } from "jotai";
import {
  userAtom,
  User,
  UserProfile,
} from "../store";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Calendar } from "lucide-react";
import EditProfileModal from "../Components/ProfileComponents/EditProfileModal"; 

import ProfilePost from "../Components/ProfileComponents/ProfilePost"; 
import ProfileGig from "../Components/ProfileComponents/ProfileGig"; 
import ProfileRoom from "../Components/ProfileComponents/ProfileRoom"; 

// --- Import the shared helper ---
import { getImageUrl } from "../lib/utils";

export default function Profile() {
  const [user, setUser] = useAtom(userAtom);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("Posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const tabs = ["Posts", "Gigs", "Rooms"];

  useEffect(() => {
    if (!user) return;

    fetch(`http://localhost:4000/user/profile/${user.username}`)
      .then(async (res) => {
        if (!res.ok) {
          console.error("Failed to fetch profile data");
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const json = await res.json();
        setProfile(json);
      })
      .catch((err) => console.error(err));
  }, [user]);

  const handleProfileUpdate = (updatedProfileData: UserProfile) => {

    setProfile(updatedProfileData);


    const { posts, gigs, rooms, mapRooms, ...updatedUser } = updatedProfileData;
    setUser(updatedUser as User);

    setIsEditModalOpen(false);
  };

  if (!profile)
    return (
       <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <span className="loading loading-dots loading-xl text-white"></span>
    </div>
    );

 
  const allRooms = [
    ...profile.mapRooms,
    ...profile.rooms.filter(
      (room) => !profile.mapRooms.some((mr) => mr.id === room.id)
    ),
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-200">
      <div className="border-x border-zinc-700 min-h-screen">
        {/* Header section */}
        <div>
          <div className="relative h-48 bg-zinc-800 border-b border-zinc-700">
            {profile.posterImage && (
              <Image
                src={getImageUrl(profile.posterImage)}
                alt="Poster"
                fill
                style={{ objectFit: "cover" }}
              />
            )}
          </div>
          <div className="p-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 flex justify-between items-end -mt-20"
            >
              {profile.image ? (
                <Image
                  src={getImageUrl(profile.image)}
                  alt={profile.name}
                  width={128}
                  height={128}
                  className="rounded-full object-cover border-4 border-black w-32 h-32"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-zinc-700 flex items-center justify-center text-4xl border-4 border-black">
                  {profile.name[0]}
                </div>
              )}

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-1.5 rounded-full border border-zinc-600 text-sm font-bold hover:bg-zinc-800 transition-colors"
              >
                Edit profile
              </button>
            </motion.div>

            <div className="mt-4">
              <h1 className="text-xl font-bold">{profile.name}</h1>
              <p className="text-zinc-500">@{profile.username}</p>
            </div>
            <div className="text-zinc-500 text-sm flex items-center gap-2 mt-3">
              <Calendar size={16} />
              Joined{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-zinc-700">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex-grow py-4 px-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "text-white"
                    : "text-zinc-500 hover:bg-zinc-900/70"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-blue-500"></span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {/* --- POSTS TAB --- */}
          {activeTab === "Posts" && (
            <div className="flex flex-col">
              {profile.posts.length > 0 ? (
                profile.posts.map((post) => (
                  <ProfilePost
                    key={post.id}
                    post={post}
                    userImageUrl={profile.image}
                  />
                ))
              ) : (
                <p className="text-zinc-500 text-center p-8">No posts yet</p>
              )}
            </div>
          )}

          {/* --- GIGS TAB --- */}
          {activeTab === "Gigs" && (
            <div className="flex flex-col">
              {profile.gigs.length > 0 ? (
                profile.gigs.map((gig) => (
                  <ProfileGig
                    key={gig.id}
                    gig={gig}
                    userName={profile.name}
                    userImageUrl={profile.image}
                  />
                ))
              ) : (
                <p className="text-zinc-500 text-center p-8">No gigs yet</p>
              )}
            </div>
          )}

          {/* --- ROOMS TAB --- */}
          {activeTab === "Rooms" && (
            <div className="flex flex-col">
              {allRooms.length > 0 ? (
                allRooms.map((room) => (
                  <ProfileRoom key={room.id} room={room} />
                ))
              ) : (
                <p className="text-zinc-500 text-center p-8">No rooms yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}
