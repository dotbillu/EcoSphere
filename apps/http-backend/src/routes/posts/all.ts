import { Router } from "express";
import { prisma } from "@lib/prisma";
import { upload } from "@multer";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

router.post("/uploadPosts", upload.array("images", 5), async (req, res) => {
  try {
    const { username, name, content, location } = req.body;
    const imageFiles = req.files as Express.Multer.File[];

    if (!username || !name || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const imageUrls = imageFiles?.map((file) => file.path) || [];

    const post = await prisma.post.create({
      data: {
        username,
        name,
        content,
        location,
        imageUrls,
      },
    });

    res.status(200).json(post);
  } catch (err) {
    console.error("Error uploading post:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route: GET /feedpost/posts (Global/All posts)
router.get("/posts", async (req, res) => {
  const skip = parseInt(req.query.skip as string) || 0;
  const take = parseInt(req.query.take as string) || 5;

  try {
    const posts = await prisma.post.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" as const },
      include: {
        user: {
          select: { image: true },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          orderBy: {
            createdAt: "desc" as const,
          },
          take: 3,
          include: {
            user: {
              select: {
                username: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route: GET /feedpost/posts/:id
router.get("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, username: true, image: true } },
        likes: { include: { user: { select: { username: true } } } },
        comments: {
          orderBy: { createdAt: "desc" as const },
          include: {
            user: { select: { name: true, username: true, image: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    console.error("Error fetching single post:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route: POST /feedpost/posts/:postId/like
router.post("/posts/:postId/like", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      res.status(200).json({ message: "Post unliked" });
    } else {
      await prisma.like.create({
        data: {
          postId,
          userId,
        },
      });
      res.status(200).json({ message: "Post liked" });
    }
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route: POST /feedpost/posts/:postId/comment
router.post("/posts/:postId/comment", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res
        .status(400)
        .json({ message: "userId and content are required" });
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId,
      },
      include: {
        user: {
          select: { name: true, username: true, image: true },
        },
      },
    });

    res.status(201).json(newComment);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route: DELETE /feedpost/posts/:postId
router.delete("/posts/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    await prisma.like.deleteMany({
      where: { postId },
    });
    await prisma.comment.deleteMany({
      where: { postId },
    });

    await prisma.post.delete({
      where: { id: postId },
    });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
