import { Router } from "express";
import { prisma } from "../lib/prisma";
import { upload } from "../multer";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();


// --- Upload Post ---
router.post("/uploadPosts", upload.array("images", 5), async (req, res) => {
  try {
    const { username, name, content, location } = req.body;
    const imageFiles = req.files as Express.Multer.File[];

    if (!username || !name || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const imageUrls = imageFiles?.map((file) => file.filename) || [];

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

// --- Fetch Posts ---
router.get("/posts", async (req, res) => {
  const skip = parseInt(req.query.skip as string) || 0;
  const take = parseInt(req.query.take as string) || 5;

  try {
    const posts = await prisma.post.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { image: true },
        },
      },
    });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

