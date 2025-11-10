"use client";

import { useAtom } from "jotai";
import { userAtom, User, UserProfile } from "../../store";
import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Calendar, Loader2 } from "lucide-react";
import EditProfileModal from "../../Components/ProfileComponents/EditProfileModal";
import { useRouter, useParams } from "next/navigation";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

import ProfilePost from "../../Components/ProfileComponents/ProfilePost";
import ProfileGig from "../../Components/ProfileComponents/ProfileGig";
import ProfileRoom from "../../Components/ProfileComponents/ProfileRoom";

import { getImageUrl } from "../../lib/utils";

// API Helper Functions
const fetchProfile = async (username: string): Promise<UserProfile> => {
  const res = await fetch(`http://localhost:4000/user/profile/${username}`);
  if (!res.ok) {
    throw new Error("Failed to fetch profile");
  }
  return res.json();
};

const toggleFollow = async ({
  currentUserId,
  targetUsername,
}: {
  currentUserId: number;
  targetUsername: string;
}) => {
  const res = await fetch(`http://localhost:4000/user/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentUserId, targetUsername }),
  });
  if (!res.ok) {
    throw new Error("Failed to toggle follow");
  }
  return res.json();
};

// [NEW] API helper for toggling like
const toggleLike = async ({
  userId,
  postId,
}: {
  userId: number;
  postId: number;
}) => {
  const res = await fetch(`http://localhost:4000/posts/${postId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    throw new Error("Failed to toggle like");
  }
  // Assuming the server returns the updated Profile data structure for re-syncing
  return res.json();
};

export default function Profile() {
  const [loggedInUser, setLoggedInUser] = useAtom(userAtom);
  const [activeTab, setActiveTab] = useState("Posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const usernameFromUrl = params.username as string;

  const tabs = ["Posts", "Gigs", "Rooms"];
  const queryClient = useQueryClient();

  // 1. Ref to hold the follow debounce timer
  const followDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  // [NEW] 2. Ref to hold the like debounce timer
  const likeDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery<UserProfile>({
    queryKey: ["profile", usernameFromUrl],
    queryFn: () => fetchProfile(usernameFromUrl),
    enabled: !!usernameFromUrl,
  });

  const isOwner = loggedInUser?.username === profile?.username;

  const isFollowing = useMemo(() => {
    if (!loggedInUser?.id || !profile?.followers) return false;
    return profile.followers.some((user) => user.id === loggedInUser.id);
  }, [profile?.followers, loggedInUser?.id]);

  // Follow Mutation (Uses followDebounceTimer ref)
  const followMutation = useMutation({
    mutationFn: toggleFollow,
    onSettled: (data) => {
      if (data?.profile) {
        queryClient.setQueryData(
          ["profile", data.profile.username],
          data.profile,
        );
      } else {
        queryClient.invalidateQueries({ queryKey: ["profile", usernameFromUrl] });
      }
    },
  });

  // [NEW] Like Mutation (Uses likeDebounceTimer ref)
  const likeMutation = useMutation({
    mutationFn: toggleLike,
    onSettled: (data) => {
      // Re-sync profile data if server returns it (best practice)
      if (data?.profile) {
        queryClient.setQueryData(
          ["profile", data.profile.username],
          data.profile,
        );
      } else {
        // Fallback: Invalidate profile and general posts query for eventual consistency
        queryClient.invalidateQueries({ queryKey: ["profile", usernameFromUrl] });
      }
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleProfileUpdate = (updatedProfileData: UserProfile) => {
    queryClient.setQueryData(
      ["profile", usernameFromUrl],
      updatedProfileData,
    );
    const { posts, gigs, rooms, mapRooms, followers, following, ...updatedUser } =
      updatedProfileData;
    setLoggedInUser(updatedUser as User);
    setIsEditModalOpen(false);
  };

  // [UPDATED] Like Handler uses optimistic update and debounced mutation
  const handleLikeToggle = (postId: number) => {
    if (!loggedInUser?.id || !profile) return;
    const currentUserId = loggedInUser.id;
    const queryKey = ["profile", usernameFromUrl];

    // 1. Optimistic Update (immediate UI change)
    queryClient.setQueryData<UserProfile>(queryKey, (previousProfile) => {
      if (!previousProfile) return;

      return {
        ...previousProfile,
        posts: previousProfile.posts.map((post) => {
          if (post.id === postId) {
            const isLiked = post.likes.some(
              (like) => like.userId === currentUserId,
            );
            
            const optimisticLikeEntry = { userId: currentUserId };

            if (isLiked) {
              // Optimistically unlike
              return {
                ...post,
                likes: post.likes.filter(
                  (like) => like.userId !== currentUserId,
                ),
                _count: { ...post._count, likes: post._count.likes - 1 },
              };
            } else {
              // Optimistically like
              return {
                ...post,
                likes: [...post.likes, optimisticLikeEntry],
                _count: { ...post._count, likes: post._count.likes + 1 },
              };
            }
          }
          return post;
        }),
      };
    });

    // 2. Clear any pending network request
    if (likeDebounceTimer.current) {
      clearTimeout(likeDebounceTimer.current);
    }

    // 3. Set a new timer to send the actual request via mutation
    likeDebounceTimer.current = setTimeout(() => {
      likeMutation.mutate({
        userId: currentUserId,
        postId: postId,
      });
    }, 1000); // 1-second debounce delay
  };


  const handleNavigateToPost = (postId: number) => {
    router.push(`/post/${postId}`);
  };

  // Follow Handler (renamed ref for clarity)
  const handleToggleFollow = () => {
    if (!loggedInUser?.id || !profile?.username) return;

    const queryKey = ["profile", usernameFromUrl];

    // 1. Optimistic Update (happens instantly on every click)
    queryClient.setQueryData<UserProfile>(queryKey, (oldProfile) => {
      if (!oldProfile) return;

      const optimisticFollower = {
        id: loggedInUser.id,
        username: loggedInUser.username,
        name: loggedInUser.name,
        image: loggedInUser.image,
      };

      const alreadyFollowing = oldProfile.followers.some(
        (f) => f.id === loggedInUser.id,
      );
      let newFollowers;

      if (alreadyFollowing) {
        newFollowers = oldProfile.followers.filter(
          (f) => f.id !== loggedInUser.id,
        );
      } else {
        newFollowers = [...oldProfile.followers, optimisticFollower];
      }
      return { ...oldProfile, followers: newFollowers };
    });

    // 2. Clear any pending network request
    if (followDebounceTimer.current) { // Using followDebounceTimer
      clearTimeout(followDebounceTimer.current);
    }

    // 3. Set a new timer to send the actual request
    followDebounceTimer.current = setTimeout(() => { // Using followDebounceTimer
      followMutation.mutate({
        currentUserId: loggedInUser.id,
        targetUsername: profile.username,
      });
    }, 1000); // 1-second delay
  };

  if (isLoading)
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );

  if (isError || !profile) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <p className="text-zinc-400">Could not load profile.</p>
      </div>
    );
  }

  const allRooms = [
    ...profile.mapRooms,
    ...profile.rooms.filter(
      (room) => !profile.mapRooms.some((mr) => mr.id === room.id),
    ),
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-200">
      <div className="border-x border-zinc-700 min-h-screen">
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

              {/* --- 5. (THE FIX) Button Logic --- */}
              {isOwner ? (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-1.5 rounded-full border border-zinc-600 text-sm font-bold hover:bg-zinc-800 transition-colors"
                >
                  Edit profile
                </button>
              ) : (
                <button
                  onClick={handleToggleFollow}
                  // No 'disabled' prop!
                  className={`px-5 py-1.5 rounded-full text-sm font-bold transition-colors ${
                    isFollowing
                      ? "bg-transparent border border-zinc-600 text-white hover:bg-red-900/40 hover:border-red-500"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}
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

            <div className="flex gap-4 mt-3 text-sm">
              <p>
                <span className="font-bold text-white">
                  {profile.following.length}
                </span>
                <span className="text-zinc-500"> Following</span>
              </p>
              <p>
                <span className="font-bold text-white">
                  {profile.followers.length}
                </span>
                <span className="text-zinc-500"> Followers</span>
              </p>
            </div>
          </div>
        </div>

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

        <div>
          {activeTab === "Posts" && (
            <div className="flex flex-col">
              {profile.posts.length > 0 ? (
                profile.posts.map((post) => (
                  <ProfilePost
                    key={post.id}
                    post={post}
                    userImageUrl={profile.image}
                    currentUserId={loggedInUser?.id}
                    onLikeToggle={handleLikeToggle}
                    onNavigate={handleNavigateToPost}
                  />
                ))
              ) : (
                <p className="text-zinc-500 text-center p-8">No posts yet</p>
              )}
            </div>
          )}

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

      {isOwner && isEditModalOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}
