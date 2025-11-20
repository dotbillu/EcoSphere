import { Router } from "express";
import { prisma } from "@lib/prisma";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

router.get("/feed", async (req, res) => {
  const {
    userId,
    skip,
    take,
    posts: filterPosts,
    gigs: filterGigs,
    rooms: filterRooms,
  } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const currentUserId = String(userId);
    const skipNum = parseInt(skip as string) || 0;
    const takeNum = parseInt(take as string) || 10;

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        following: {
          select: { id: true, username: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followedUserIds = user.following.map((u: any) => String(u.id));
    const followedUsernames = user.following.map((u: any) => u.username);

    if (followedUserIds.length === 0) {
      return res.json({ items: [], hasNextPage: false });
    }

    let allItems: any[] = [];

    if (filterPosts === "true") {
      const posts = await prisma.post.findMany({
        where: {
          username: { in: followedUsernames },
        },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { image: true } },
          likes: { select: { userId: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });
      allItems.push(
        ...posts.map((item: any) => {
          const { createdAt, ...rest } = item;
          return {
            type: "post" as const,
            data: { ...rest, createdAt: createdAt.toISOString() },
            sortDate: createdAt,
          };
        }),
      );
    }

    if (filterGigs === "true") {
      const gigs = await prisma.gig.findMany({
        where: {
          creatorId: { in: followedUserIds },
        },
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, username: true, name: true, image: true },
          },
        },
      });
      allItems.push(
        ...gigs.map((item: any) => {
          const { createdAt, date, expiresAt, ...rest } = item;
          return {
            type: "gig" as const,
            data: {
              ...rest,
              createdAt: createdAt.toISOString(),
              date: date ? date.toISOString() : null,
              expiresAt: expiresAt ? expiresAt.toISOString() : null,
            },
            sortDate: createdAt,
          };
        }),
      );
    }

    if (filterRooms === "true") {
      const rooms = await prisma.mapRoom.findMany({
        where: {
          creatorId: { in: followedUserIds },
        },
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, username: true, name: true, image: true },
          },
        },
      });
      allItems.push(
        ...rooms.map((item: any) => {
          const { createdAt, ...rest } = item;
          return {
            type: "room" as const,
            data: {
              ...rest,
              createdAt: createdAt.toISOString(),
            },
            sortDate: createdAt,
          };
        }),
      );
    }

    allItems.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

    const paginatedItems = allItems.slice(skipNum, skipNum + takeNum);
    const hasNextPage = allItems.length > skipNum + takeNum;

    res.json({ items: paginatedItems, hasNextPage });
  } catch (err) {
    console.error("Error fetching network feed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
