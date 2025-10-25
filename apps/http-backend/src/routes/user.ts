import { Router } from "express";
import { prisma } from "../lib/prisma";
import { upload } from "../multer";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

// --- Create or find user ---
router.post("/", async (req, res) => {
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

// --- Get user profile ---
router.get("/profile/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
        },
        rooms: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            latitude: true,
            longitude: true,
            type: true,
          },
        },
        mapRooms: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            latitude: true,
            longitude: true,
            type: true,
          },
        },
        gigs: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            latitude: true,
            longitude: true,
            date: true,
            imageUrls: true,
            type: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// --- Update user profile ---
router.patch(
  "/profile/:username",

  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "posterImage", maxCount: 1 },
  ]),
  async (req, res) => {
    const { username } = req.params;
    const { name } = req.body;

    
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    const imageFile = files?.["image"]?.[0];
    const posterImageFile = files?.["posterImage"]?.[0];

    try {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

    
      const updateData: {
        name?: string;
        image?: string;
        posterImage?: string;
      } = {};

      if (name && name !== existingUser.name) {
        updateData.name = name;
      }

      if (imageFile) {
        updateData.image = imageFile.filename;
      }

  
      if (posterImageFile) {
        updateData.posterImage = posterImageFile.filename;
      }

    
      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { username },
          data: updateData,
        });

     
        if (updateData.name) {
          await prisma.post.updateMany({
            where: { username },
            data: { name: updateData.name },
          });
        }
      }

     
      
      const updatedFullProfile = await prisma.user.findUnique({
        where: { username },
        include: {
          posts: {
            orderBy: { createdAt: "desc" },
          },
          rooms: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
              latitude: true,
              longitude: true,
              type: true,
            },
          },
          mapRooms: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
              latitude: true,
              longitude: true,
              type: true,
            },
          },
          gigs: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              title: true,
              description: true,
              latitude: true,
              longitude: true,
              date: true,
              imageUrls: true,
              type: true,
            },
          },
        },
      });

      console.log(`Updated profile for: ${username}`);
      res.status(200).json(updatedFullProfile);
    } catch (err) {
      console.error(`Error updating profile for ${username}:`, err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;

