"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import CreatePost from "./createPost";
import NextImage from "next/image";

interface Post {
  id: number;
  username: string;
  content: string;
  imageUrls: string[];
  createdAt: string;
  location?: string;
}

export default function Feedbox() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);

  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:4000/posts?skip=${page * 5}&take=5`
        );
        const data: Post[] = await res.json();

        // Deduplicate posts by ID
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPosts = data.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });

        if (data.length < 5) setHasMore(false);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [page]);

  return (
    <div className="flex justify-center min-h-screen">
      <div className="w-full max-w-md mt-8 space-y-6">
        <CreatePost />
        {posts.map((post, idx) => {
          const isLast = idx === posts.length - 1;
          return (
            <div
              key={`${post.id}-${idx}`} // unique key
              ref={isLast ? lastPostRef : null}
              className="border border-gray-600 rounded-2xl p-4 space-y-2 bg-black/50"
            >
              <div className="flex items-center gap-2">
                <div className="bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center">
                  {post.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{post.username}</p>
                  {post.location && (
                    <p className="text-gray-400 text-sm">{post.location}</p>
                  )}
                </div>
              </div>

              <p className="text-white">{post.content}</p>

              {post.imageUrls.length > 0 && (
                <div className="relative w-full h-60 rounded-xl overflow-hidden">
                  <NextImage
                    src={`http://localhost:4000/uploads/${post.imageUrls[0]}`}
                    alt="Post image"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}

              <p className="text-gray-400 text-xs">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
          );
        })}
        {loading && <p className="text-white text-center">Loading...</p>}
        {!hasMore && <p className="text-gray-400 text-center">No more posts</p>}
      </div>
    </div>
  );
}

