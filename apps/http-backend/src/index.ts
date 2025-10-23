import express from "express";
import cors from "cors";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
// No path import needed if "uploads" is at the root

const app = express();
const prisma = new PrismaClient();
const upload = multer({ dest: "uploads/" });
const PORT = 4000;

app.use(cors());
app.use(express.json());

// --- THIS IS THE FIX ---
// Serve static files from the "uploads" directory
// This makes files in the 'uploads' folder accessible via 'http://localhost:4000/uploads/FILENAME'
app.use("/uploads", express.static("uploads"));

// --- User route ---
app.post("/user", async (req, res) => {
  const { name, email, image } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const username =
        name.toLowerCase().replace(/\s+/g, "") +
        Math.floor(Math.random() * 10000);

      user = await prisma.user.create({
        data: { name, email, image, username },
      });

      console.log(`Created new user: ${email} with username: ${username}`);
    } else {
      console.log(`User already exists: ${email}`);
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(`Error creating user: ${err}`);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- Upload posts route ---
app.post("/uploadPosts", upload.single("image"), async (req, res) => {
  try {
    const { username, content, location } = req.body;
    const imageFile = req.file;

    if (!username || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // This is correct, it stores just the filename
    const imageUrls = imageFile ? [imageFile.filename] : [];

    const post = await prisma.post.create({
      data: {
        username,
        content,
        location,
        imageUrls,
        likes: 0,
      },
    });

    res.status(200).json(post);
  } catch (err) {
    console.error("Error uploading post:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /posts?skip=0&take=5
app.get("/posts", async (req, res) => {
  const skip = parseInt(req.query.skip as string) || 0;
  const take = parseInt(req.query.take as string) || 5;

  try {
    const posts = await prisma.post.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
    res.json(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
