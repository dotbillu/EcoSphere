import { Router } from "express";
import { prisma } from "@lib/prisma";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

router.get("/feed", async (req, res) => {
  const {
    skip,
    take,
    posts: filterPosts,
    gigs: filterGigs,
    rooms: filterRooms,
  } = req.query;

  try {
    const skipNum = parseInt(skip as string) || 0;
    const takeNum = parseInt(take as string) || 10;

    let allItems: any[] = [];

    if (filterPosts === "true") {
      const posts = await prisma.post.findMany({
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
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
