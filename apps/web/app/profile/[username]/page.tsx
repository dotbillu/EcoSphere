"use client";

import { useAtom } from "jotai";
import { userAtom, User, UserProfile } from "../../store";
import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Calendar, Loader2 } from "lucide-react";
import EditProfileModal from "@profilecomponents/EditProfileModal";
import { useRouter, useParams } from "next/navigation";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

import ProfilePost from "@profilecomponents/ProfilePost";
import ProfileGig from "@profilecomponents/ProfileGig";
import ProfileRoom from "@profilecomponents/ProfileRoom";

import { getImageUrl } from "@lib/utils";
import { API_BASE_URL } from "@/lib/constants";

const fetchProfile = async (username: string): Promise<UserProfile> => {
  const res = await fetch(`${API_BASE_URL}/user/profile/${username}`);
  if (!res.ok) {
    throw new Error("Failed to fetch profile");
  }
  return res.json();
};

const toggleFollow = async ({
  currentUserId,
  targetUsername,
}: {
  currentUserId: string; 
  targetUsername: string;
}) => {
  const res = await fetch(`${API_BASE_URL}/user/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentUserId, targetUsername }),
  });
  if (!res.ok) {
    throw new Error("Failed to toggle follow");
  }
  return res.json();
};

const toggleLike = async ({
  userId,
  postId,
}: {
  userId: string; 
  postId: string; 
}) => {
  const res = await fetch(`${API_BASE_URL}/feed/posts/${postId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    throw new Error("Failed to toggle like");
  }
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

  const followDebounceTimer = useRef<NodeJS.Timeout | null>(null);
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

  const likeMutation = useMutation({
    mutationFn: toggleLike,
    onSettled: (data) => {
      if (data?.profile) {
        queryClient.setQueryData(
          ["profile", data.profile.username],
          data.profile,
        );
      } else {
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

  const handleLikeToggle = (postId: string) => {
    if (!loggedInUser?.id || !profile) return;
    const currentUserId = loggedInUser.id; 
    const queryKey = ["profile", usernameFromUrl];

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
              return {
                ...post,
                likes: post.likes.filter(
                  (like) => like.userId !== currentUserId, 
                ),
                _count: { ...post._count, likes: post._count.likes - 1 },
              };
            } else {
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

    if (likeDebounceTimer.current) {
      clearTimeout(likeDebounceTimer.current);
    }

    likeDebounceTimer.current = setTimeout(() => {
      likeMutation.mutate({
        userId: currentUserId, // string
        postId: postId, // string
      });
    }, 1000);
  };

  const handleNavigateToPost = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleToggleFollow = () => {
    if (!loggedInUser?.id || !profile?.username) return;

    const queryKey = ["profile", usernameFromUrl];

    queryClient.setQueryData<UserProfile>(queryKey, (oldProfile) => {
      if (!oldProfile) return;

      const optimisticFollower = {
        id: loggedInUser.id, // string
        username: loggedInUser.username,
        name: loggedInUser.name,
        image: loggedInUser.image,
      };

      const alreadyFollowing = oldProfile.followers.some(
        (f) => f.id === loggedInUser.id, // Compare string IDs
      );
      let newFollowers;

      if (alreadyFollowing) {
        newFollowers = oldProfile.followers.filter(
          (f) => f.id !== loggedInUser.id, // Compare string IDs
        );
      } else {
        newFollowers = [...oldProfile.followers, optimisticFollower];
      }
      return { ...oldProfile, followers: newFollowers };
    });

    if (followDebounceTimer.current) {
      clearTimeout(followDebounceTimer.current);
    }

    followDebounceTimer.current = setTimeout(() => {
      followMutation.mutate({
        currentUserId: loggedInUser.id, // string
        targetUsername: profile.username,
      });
    }, 1000);
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
    <div className="bg-black text-zinc-200">
      <div className="border-x border-zinc-700">
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
