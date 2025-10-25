import express from "express";
import cors from "cors";
import multer from "multer";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure 'uploads/' directory exists
  },
  filename: (req, file, cb) => {
    // Create a unique filename to avoid overwrites
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static("uploads"));

// --- (Existing /user route - no changes) ---
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

// --- (Existing /uploadPosts route - no changes) ---
app.post("/uploadPosts", upload.array("images", 5), async (req, res) => {
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

// --- (Existing /posts route - no changes) ---
// Find this route in your backend index.ts and update it

app.get("/posts", async (req, res) => {
  const skip = parseInt(req.query.skip as string) || 0;
  const take = parseInt(req.query.take as string) || 5;

  try {
    const posts = await prisma.post.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      // --- ADD THIS 'INCLUDE' BLOCK ---
      include: {
        user: {
          select: {
            image: true, // We only need the user's image
          },
        },
      },
      // ---------------------------------
    });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});// --- (Existing /userProfile/:username route - no changes) ---
app.get("/userProfile/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { posts: { orderBy: { createdAt: "desc" } } },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// -----------------------------------------------------------------
// ✨ NEW: Route to update user profile
// -----------------------------------------------------------------
app.patch("/userProfile/:username", upload.single("image"), async (req, res) => {
  const { username } = req.params;
  const { name } = req.body;
  const imageFile = req.file;

  try {
    // Find the user first
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare data for update
    const updateData: { name?: string; image?: string } = {};

    if (name && name !== existingUser.name) {
      updateData.name = name;
    }

    if (imageFile) {
      updateData.image = imageFile.filename;
      // TODO: In a real app, you would also delete the old image file
      // from the 'uploads/' directory to save space.
    }

    // If no data to update, just return the user
    if (Object.keys(updateData).length === 0) {
      return res.status(200).json(existingUser);
    }

    // Update the user in the database
    const updatedUser = await prisma.user.update({
      where: { username },
      data: updateData,
    });

    // Also update the 'name' on all of the user's posts
    if (updateData.name) {
      await prisma.post.updateMany({
        where: { username: username },
        data: { name: updateData.name },
      });
    }

    console.log(`Updated profile for: ${username}`);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(`Error updating profile for ${username}:`, err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
