"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, MessageCircle, MapPin, ArrowLeft, Loader2 } from "lucide-react";
import { useAtom } from "jotai";
import { userAtom } from "../../store";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface UserInfo {
  name: string;
  username: string;
  image: string | null;
}
interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: UserInfo;
}
interface Like {
  userId: number;
  user: {
    username: string;
  };
}
interface FullPost {
  id: number;
  username: string;
  name?: string;
  content: string;
  imageUrls: string[];
  createdAt: string;
  location?: string;
  user: UserInfo;
  likes: Like[];
  comments: Comment[];
  _count: {
    likes: number;
    comments: number;
  };
}

export default function PostDetailPage() {
  const [post, setPost] = useState<FullPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const params = useParams();
  const { id: postId } = params;

  const [user] = useAtom(userAtom);
  const currentUserId = user?.id;
  const currentUserImage = user?.image;
  const currentUserStatus = user ? "authenticated" : "unauthenticated";

  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:4000/posts/${postId}`);
        if (!res.ok) throw new Error("Post not found");
        const data: FullPost = await res.json();
        setPost(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleLikeToggle = async () => {
    if (!currentUserId || !post) return;

    const isLiked = post.likes.some((like) => like.userId === currentUserId);

    setPost((prevPost) => {
      if (!prevPost) return null;
      if (isLiked) {
        return {
          ...prevPost,
          likes: prevPost.likes.filter((like) => like.userId !== currentUserId),
          _count: { ...prevPost._count, likes: prevPost._count.likes - 1 },
        };
      } else {
        return {
          ...prevPost,
          likes: [
            ...prevPost.likes,
            { userId: currentUserId, user: { username: user?.username || "..." } },
          ],
          _count: { ...prevPost._count, likes: prevPost._count.likes + 1 },
        };
      }
    });

    try {
      const res = await fetch(`http://localhost:4000/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      if (!res.ok) throw new Error("API call failed");
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !post || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:4000/posts/${post.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, content: comment }),
      });
      if (!res.ok) throw new Error("Failed to post comment");

      const newComment: Comment = await res.json();

      setPost((prevPost) => {
        if (!prevPost) return null;
        return {
          ...prevPost,
          comments: [newComment, ...prevPost.comments],
          _count: {
            ...prevPost._count,
            comments: prevPost._count.comments + 1,
          },
        };
      });
      setComment("");
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto border-l border-r border-gray-700 min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full max-w-2xl mx-auto border-l border-r border-gray-700 min-h-screen bg-black">
        <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 flex items-center gap-4 p-4 border-b border-gray-700">
          <button
            onClick={() => router.back()}
            className="text-white p-2 rounded-full hover:bg-gray-800"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white">Post not found</h1>
        </div>
      </div>
    );
  }

  const isLikedByCurrentUser = post.likes.some(
    (like) => like.userId === currentUserId,
  );

  return (
    <div className="w-full max-w-2xl mx-auto border-l border-r border-gray-700 min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 flex items-center gap-4 p-4 border-b border-gray-700">
        <button
          onClick={() => router.back()}
          className="text-white p-2 rounded-full hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Post</h1>
      </div>

      {/* Main Post */}
      <div className="flex space-x-3 p-4 border-b border-gray-700">
        <div className="flex-shrink-0">
          {post.user?.image ? (
            <Image
              src={
                post.user.image.startsWith("http")
                  ? post.user.image
                  : `http://localhost:4000/uploads/${post.user.image}`
              }
              alt={post.username}
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10"
            />
          ) : (
            <div className="bg-neutral-focus text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
              {post.username[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-bold">{post.name || post.username}</p>
            <p className="text-gray-400">@{post.username}</p>
          </div>
          <p className="text-gray-500 text-sm">
            {new Date(post.createdAt).toLocaleString()}
          </p>

          <p className="text-white mt-4 whitespace-pre-wrap break-words">
            {post.content}
          </p>

          {post.location && (
            <p className="text-gray-400 text-sm flex items-center gap-1 mt-2">
              <MapPin size={16} />
              {post.location}
            </p>
          )}

          {post.imageUrls.length > 0 && (
            <div className="relative w-full max-w-xl h-80 rounded-2xl overflow-hidden mt-3 border border-gray-700">
              <Image
                src={`http://localhost:4000/uploads/${post.imageUrls[0]}`}
                alt="Post image"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          )}

          <div className="flex items-center gap-6 mt-4 text-gray-500">
            <button
              onClick={handleLikeToggle}
              disabled={currentUserStatus !== "authenticated"}
              className={`flex items-center gap-1.5 transition-colors duration-200 group ${
                isLikedByCurrentUser ? "text-red-500" : "hover:text-red-500"
              } ${currentUserStatus !== "authenticated" ? "opacity-50" : ""}`}
            >
              <Heart
                size={18}
                fill={isLikedByCurrentUser ? "currentColor" : "none"}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="text-sm">{post._count.likes}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <MessageCircle size={18} />
              <span className="text-sm">{post._count.comments}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comment Form */}
      {currentUserStatus === "authenticated" && (
        <form
          onSubmit={handleCommentSubmit}
          className="flex gap-3 p-4 border-b bg-black border-gray-700"
        >
          <div className="flex-shrink-0 mt-2">
            {currentUserImage ? (
              <Image
                src={
                  currentUserImage.startsWith("http")
                    ? currentUserImage
                    : `http://localhost:4000/uploads/${currentUserImage}`
                }
                alt={user?.username || "user"}
                width={40}
                height={40}
                className="rounded-full object-cover w-10 h-10"
              />
            ) : (
              <div className="bg-neutral-focus text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
                {user?.username[0].toUpperCase()}
              </div>
            )}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Post your reply"
            className="textarea textarea-bordered w-full bg-gray-900 text-white placeholder-gray-500"
            rows={2}
          />
          <button
            type="submit"
            className="btn btn-primary rounded-xl"
            disabled={isSubmitting || !comment.trim()}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Comment"}
          </button>
        </form>
      )}

      {/* Comments */}
      <div className="pb-24">
        {post.comments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex space-x-3 p-4 border-b border-gray-700"
          >
            <div className="flex-shrink-0">
              {comment.user.image ? (
                <Image
                  src={
                    comment.user.image.startsWith("http")
                      ? comment.user.image
                      : `http://localhost:4000/uploads/${comment.user.image}`
                  }
                  alt={comment.user.username}
                  width={40}
                  height={40}
                  className="rounded-full object-cover w-10 h-10"
                />
              ) : (
                <div className="bg-neutral-focus text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
                  {comment.user.username[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-bold">
                  {comment.user.name || comment.user.username}
                </p>
                <p className="text-gray-400">@{comment.user.username}</p>
                <p className="text-gray-500 text-sm">
                  · {new Date(comment.createdAt).toLocaleDateString()}
                </p>
              </div>
              <p className="text-white mt-1 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

