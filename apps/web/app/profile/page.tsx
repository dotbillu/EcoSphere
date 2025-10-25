"use client";

import { useAtom } from "jotai";
import { userAtom, User } from "../store"; // Import User type
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";
import EditProfileModal from "../Components/EditProfileModal";

interface Post {
  id: number;
  username: string;
  name: string;
  content: string;
  imageUrls: string[];
  location?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  image?: string | null;
  createdAt: string;
  posts: Post[];
}

// -----------------------------------------------------------------
// 1. MODIFICATION: Added 'userImageUrl' prop
// -----------------------------------------------------------------
function ProfilePost({
  post,
  userImageUrl, // New prop
}: {
  post: Post;
  userImageUrl?: string | null; // New prop
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      const hasOverflow =
        contentRef.current.scrollHeight > contentRef.current.clientHeight;
      if (!isExpanded) setNeedsTruncation(hasOverflow);
    }
  }, [post.content, isExpanded]);

  const openModal = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);
  const showNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalImageIndex((prev) =>
      prev < post.imageUrls.length - 1 ? prev + 1 : 0,
    );
  };
  const showPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalImageIndex((prev) =>
      prev > 0 ? prev - 1 : post.imageUrls.length - 1,
    );
  };

  // ... (renderImageGrid function is unchanged, omitted for brevity) ...
  const renderImageGrid = () => {
    const count = post.imageUrls.length;
    if (count === 0) return null;
    const gridBase =
      "relative w-full max-w-xl h-80 rounded-2xl overflow-hidden mt-3 border border-zinc-700";
    if (count === 1) {
      return (
        <div
          className={`${gridBase} cursor-pointer`}
          onClick={() => openModal(0)}
        >
          <Image
            src={`http://localhost:4000/uploads/${post.imageUrls[0]}`}
            alt="Post image"
            fill
            style={{ objectFit: "cover" }}
          />
        </div>
      );
    }
    if (count === 2) {
      return (
        <div className={`${gridBase} grid grid-cols-2 gap-0.5`}>
          {post.imageUrls.map((url, index) => (
            <div
              key={index}
              className="relative h-full cursor-pointer"
              onClick={() => openModal(index)}
            >
              <Image
                src={`http://localhost:4000/uploads/${url}`}
                alt={`Post image ${index + 1}`}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      );
    }
    if (count === 3) {
      return (
        <div className={`${gridBase} grid grid-cols-2 grid-rows-2 gap-0.5`}>
          <div
            className="relative row-span-2 cursor-pointer"
            onClick={() => openModal(0)}
          >
            <Image
              src={`http://localhost:4000/uploads/${post.imageUrls[0]}`}
              alt="Post image 1"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
          <div
            className="relative col-start-2 cursor-pointer"
            onClick={() => openModal(1)}
          >
            <Image
              src={`http://localhost:4000/uploads/${post.imageUrls[1]}`}
              alt="Post image 2"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
          <div
            className="relative col-start-2 row-start-2 cursor-pointer"
            onClick={() => openModal(2)}
          >
            <Image
              src={`http://localhost:4000/uploads/${post.imageUrls[2]}`}
              alt="Post image 3"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
      );
    }
    return (
      <div className={`${gridBase} grid grid-cols-2 grid-rows-2 gap-0.5`}>
        {post.imageUrls.slice(0, 4).map((url, index) => (
          <div
            key={index}
            className="relative h-full cursor-pointer"
            onClick={() => openModal(index)}
          >
            <Image
              src={`http://localhost:4000/uploads/${url}`}
              alt={`Post image ${index + 1}`}
              fill
              style={{ objectFit: "cover" }}
            />
            {count > 4 && index === 3 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
                +{count - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      key={post.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.2 }}
      className="p-4 border-b border-zinc-700 transition-colors hover:bg-white/5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        {/* ----------------------------------------------------------------- */}
        {/* 1. MODIFICATION: Added user avatar here                       */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {userImageUrl ? (
            <Image
              src={
                userImageUrl.startsWith("http")
                  ? userImageUrl
                  : `http://localhost:4000/uploads/${userImageUrl}`
              }
              alt={post.name}
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-lg">
              {post.name[0]}
            </div>
          )}

          {/* Name and Date */}
          <div className="flex items-center gap-2">
            <p className="text-white font-bold">{post.name}</p>
            <p className="text-zinc-400 text-sm">
              · {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {/* ----------------------------------------------------------------- */}

        {post.location && (
          <p className="text-zinc-400 text-sm flex items-center gap-1">
            <MapPin size={16} />
            {post.location}
          </p>
        )}
      </div>

      {/* Content */}
      <p
        ref={contentRef}
        className={`text-zinc-200 whitespace-pre-wrap break-words ${
          !isExpanded ? "line-clamp-8" : ""
        }`}
      >
        {post.content}
      </p>

      {(needsTruncation || isExpanded) && (
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-blue-500 hover:underline mt-2 text-sm font-medium"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}

      {/* Image Grid */}
      {renderImageGrid()}

      {/* Image Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeModal}
        >
          <button
            className="absolute top-4 right-4 text-white z-[60] p-2"
            onClick={closeModal}
          >
            <X size={32} />
          </button>
          {post.imageUrls.length > 1 && (
            <button
              className="absolute left-4 p-2 bg-black/50 rounded-full text-white z-[60] hover:bg-black/80 transition-colors"
              onClick={showPrevImage}
            >
              <ChevronLeft size={32} />
            </button>
          )}
          <div
            className="relative w-[90vw] h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={`http://localhost:4000/uploads/${post.imageUrls[modalImageIndex]}`}
              alt="Post image expanded"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
          {post.imageUrls.length > 1 && (
            <button
              className="absolute right-4 p-2 bg-black/50 rounded-full text-white z-[60] hover:bg-black/80 transition-colors"
              onClick={showNextImage}
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
// -----------------------------------------------------------------
// Main Profile Component (Updated)
// -----------------------------------------------------------------
export default function Profile() {
  const [user, setUser] = useAtom(userAtom);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("Posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const tabs = ["Posts", "Gigs"];

  useEffect(() => {
    if (!user) return;

    fetch(`http://localhost:4000/userProfile/${user.username}`)
      .then(async (res) => {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          setProfile(json);
        } catch {
          console.error("Failed to parse JSON, got:", text);
        }
      })
      .catch((err) => console.error(err));
  }, [user]);

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    const { posts, ...updatedUser } = updatedProfile;
    setUser(updatedUser as User);
    setIsEditModalOpen(false);
  };

  if (!profile)
    return (
      <div className="min-h-screen bg-black text-zinc-400 p-4 text-center">
        Loading profile...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-zinc-200">
      <div className="border-x border-zinc-700 min-h-screen">
        {/* Header section */}
        <div>
          <div className="h-48 bg-zinc-800 border-b border-zinc-700" />
          <div className="p-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-end -mt-20"
            >
              {/* ----------------------------------------------------------------- */}
              {/* 2. MODIFICATION: Updated Image 'src' to handle Google URLs      */}
              {/* ----------------------------------------------------------------- */}
              {profile.image ? (
                <Image
                  src={
                    profile.image.startsWith("http")
                      ? profile.image
                      : `http://localhost:4000/uploads/${profile.image}`
                  }
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
              {/* ----------------------------------------------------------------- */}

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-1.5 rounded-full border border-zinc-600 text-sm font-bold hover:bg-zinc-800 transition-colors"
              >
                Edit profile
              </button>
            </motion.div>

            {/* ... (Name, Handle, Joined Date, Follow Stats - no changes) ... */}
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
            <div className="flex gap-4 mt-3 text-sm">
              <p>
                <span className="font-bold text-white">0</span>
                <span className="text-zinc-500"> Following</span>
              </p>
              <p>
                <span className="font-bold text-white">0</span>
                <span className="text-zinc-500"> Followers</span>
              </p>
            </div>
          </div>
        </div>

        {/* ... (Tab Navigation - no changes) ... */}
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
          {activeTab === "Posts" && (
            <div className="flex flex-col">
              {profile.posts.length > 0 ? (
                profile.posts.map((post) => (
                  // -----------------------------------------------------------------
                  // 3. MODIFICATION: Passed 'userImageUrl' prop
                  // -----------------------------------------------------------------
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
          {activeTab === "Gigs" && (
            <div className="text-zinc-500 text-center p-8">
              <p className="text-2xl font-bold">Gigs</p>
              <p>This section is not yet implemented.</p>
            </div>
          )}
        </div>
      </div>

      {/* Render the modal conditionally */}
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
