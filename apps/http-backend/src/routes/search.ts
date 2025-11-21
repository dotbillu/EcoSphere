import { Router } from "express";
import { prisma } from "../lib/prisma";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

router.get("/", async (req, res) => {
  const { q: query, userId: currentUserId, followersOnly } = req.query;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({ message: "Search query 'q' is required" });
  }

  const searchTerm = query.trim();
  const isFollowersOnly = followersOnly === "true";
  const userIdStr = currentUserId as string;

  let followedUsernames: string[] = [];
  let followedUserIds: string[] = [];

  if (isFollowersOnly && userIdStr) {
    const user = await prisma.user.findUnique({
      where: { id: userIdStr },
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
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { username: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          isFollowersOnly ? { id: { in: followedUserIds } } : {},
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

    const posts = await prisma.post.findMany({
      where: {
        AND: [
          { content: { contains: searchTerm, mode: "insensitive" } },
          isFollowersOnly ? { username: { in: followedUsernames } } : {},
        ],
      },
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, username: true, image: true } },
      },
    });

    const gigs = await prisma.gig.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: searchTerm, mode: "insensitive" } },
              { description: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          isFollowersOnly ? { creatorId: { in: followedUserIds } } : {},
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

    const rooms = await prisma.mapRoom.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { description: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          isFollowersOnly ? { creatorId: { in: followedUserIds } } : {},
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

    const allItems = [
      ...users.map((item) => ({
        type: "user" as const,
        sortDate: new Date(),
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

    const topResults = allItems
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
      .slice(0, 5);

    res.json(topResults);
  } catch (err) {
    console.error("Error in global search:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/page", async (req, res) => {
  const { q: query, tab = "all", skip = "0", take = "10" } = req.query;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({ message: "Search query 'q' is required" });
  }

  const searchTerm = query.trim();
  const skipNum = parseInt(skip as string);
  const takeNum = parseInt(take as string);
  let results: any[] = [];
  let nextSkip: number | null = null;

  try {
    if (tab === "all" || tab === "people") {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { username: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        skip: tab === "all" ? 0 : skipNum,
        take: tab === "all" ? 5 : takeNum,
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          posterImage: true,
        },
      });
      results = [
        ...results,
        ...users.map((item) => ({ type: "user" as const, data: item })),
      ];
      if (tab === "people" && users.length === takeNum) {
        nextSkip = skipNum + takeNum;
      }
    }

    if (tab === "all" || tab === "gigs") {
      const gigs = await prisma.gig.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        skip: tab === "all" ? 0 : skipNum,
        take: tab === "all" ? 5 : takeNum,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          createdBy: {
            select: { id: true, name: true, username: true, image: true },
          },
          imageUrls: true,
        },
      });
      results = [
        ...results,
        ...gigs.map((item) => ({ type: "gig" as const, data: item })),
      ];
      if (tab === "gigs" && gigs.length === takeNum) {
        nextSkip = skipNum + takeNum;
      }
    }

    if (tab === "all" || tab === "rooms") {
      const rooms = await prisma.mapRoom.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        skip: tab === "all" ? 0 : skipNum,
        take: tab === "all" ? 5 : takeNum,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          createdBy: {
            select: { id: true, name: true, username: true, image: true },
          },
          imageUrl: true,
        },
      });
      results = [
        ...results,
        ...rooms.map((item) => ({ type: "room" as const, data: item })),
      ];
      if (tab === "rooms" && rooms.length === takeNum) {
        nextSkip = skipNum + takeNum;
      }
    }

    res.json({
      results,
      nextSkip,
    });
  } catch (err) {
    console.error("Error in paginated search:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
