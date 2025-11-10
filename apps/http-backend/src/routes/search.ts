import { Router } from "express";
import { prisma } from "../lib/prisma";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

// --- NEW: Global Search Endpoint (Upgraded) ---
router.get("/", async (req, res) => {
  const {
    q: query,
    userId: currentUserId,
    followersOnly,
  } = req.query;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({ message: "Search query 'q' is required" });
  }

  const searchTerm = query.trim();
  const isFollowersOnly = followersOnly === "true";
  const userIdNum = parseInt(currentUserId as string);

  let followedUsernames: string[] = [];
  let followedUserIds: number[] = [];

  if (isFollowersOnly && !isNaN(userIdNum)) {
    // Get the list of users the current user follows
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      include: {
        following: {
          select: { id: true, username: true },
        },
      },
    });
    if (user) {
      followedUsernames = user.following.map((u) => u.username);
      followedUserIds = user.following.map((u) => u.id);
    }
  }

  try {
    // 1. Find matching users
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { username: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          // Apply follower filter if checked
          isFollowersOnly
            ? { id: { in: followedUserIds } }
            : {},
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
      },
    });

    // 2. Find matching posts
    const posts = await prisma.post.findMany({
      where: {
        AND: [
          { content: { contains: searchTerm, mode: "insensitive" } },
          isFollowersOnly
            ? { username: { in: followedUsernames } }
            : {},
        ],
      },
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, username: true, image: true } },
      },
    });

    // 3. Find matching gigs
    const gigs = await prisma.gig.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: searchTerm, mode: "insensitive" } },
              { description: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          isFollowersOnly
            ? { creatorId: { in: followedUserIds } }
            : {},
        ],
      },
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    // 4. Find matching rooms
    const rooms = await prisma.mapRoom.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { description: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          isFollowersOnly
            ? { creatorId: { in: followedUserIds } }
            : {},
        ],
      },
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    // 5. Combine and format all items
    const allItems = [
      ...users.map((item) => ({
        type: "user" as const,
        sortDate: new Date(), // Users don't have a date, put them at the top
        data: item,
      })),
      ...posts.map((item) => ({
        type: "post" as const,
        sortDate: item.createdAt,
        data: { ...item, createdAt: item.createdAt.toISOString() },
      })),
      ...gigs.map((item) => ({
        type: "gig" as const,
        sortDate: item.createdAt,
        data: {
          ...item,
          createdAt: item.createdAt.toISOString(),
          date: item.date ? item.date.toISOString() : null,
          expiresAt: item.expiresAt ? item.expiresAt.toISOString() : null,
        },
      })),
      ...rooms.map((item) => ({
        type: "room" as const,
        sortDate: item.createdAt,
        data: { ...item, createdAt: item.createdAt.toISOString() },
      })),
    ];

    // 6. Sort the combined list
    const topResults = allItems
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
      .slice(0, 5); // Get the top 5 results overall

    res.json(topResults);
  } catch (err) {
    console.error("Error in global search:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
