import { Router } from "express";
import { prisma } from "@lib/prisma";
import { upload } from "@multer";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

router.get("/gigs", async (req, res) => {
  try {
    const gigs = await prisma.gig.findMany({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        id: true,
        title: true,
        description: true,
        latitude: true,
        longitude: true,
        date: true,
        type: true,
        imageUrls: true,
        reward: true,
        expiresAt: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    const processedGigs = gigs.map((gig) => ({
      ...gig,
      imageUrls: gig.imageUrls.slice(0, 1),
    }));

    res.json(processedGigs);
  } catch (err) {
    console.error("Error fetching gigs:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/gig", upload.array("images", 5), async (req, res) => {
  const {
    title,
    description,
    latitude,
    longitude,
    date,
    type,
    creatorId,
    roomId,
    reward,
    expiresAt,
  } = req.body;
  const imageFiles = req.files as Express.Multer.File[];

  if (!title || !latitude || !longitude || !creatorId) {
    return res.status(400).json({
      message: "Title, latitude, longitude, and creatorId are required",
    });
  }

  try {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const cId = creatorId;
    const rId = roomId ? roomId : null;
    const gigDate = date ? new Date(date) : null;
    const gigExpiresAt = expiresAt ? new Date(expiresAt) : null;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        message: "Invalid number format for coordinates",
      });
    }

    const imageUrls = imageFiles ? imageFiles.map((file) => file.filename) : [];

    const data: any = {
      title,
      description,
      latitude: lat,
      longitude: lon,
      creatorId: cId,
      type,
      date: gigDate,
      imageUrls,
      reward,
      expiresAt: gigExpiresAt,
    };

    if (rId) {
      const roomExists = await prisma.mapRoom.findUnique({
        where: { id: rId },
      });
      if (!roomExists) {
        return res.status(404).json({ message: "Linked room not found" });
      }
      data.roomId = rId;
    }

    const newGig = await prisma.gig.create({
      data,
      include: {
        createdBy: {
          select: { id: true, username: true, name: true, image: true },
        },
        room: { select: { id: true, name: true, type: true } },
      },
    });
    res.status(201).json(newGig);
  } catch (err) {
    console.error("Error creating gig:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/gig/:gigId", async (req, res) => {
  const { gigId } = req.params;
  try {
    if (!gigId) {
      return res.status(400).json({ message: "Invalid Gig ID" });
    }
    await prisma.gig.delete({
      where: { id: gigId },
    });
    res.status(200).json({ message: "Gig deleted successfully" });
  } catch (err) {
    console.error("Error deleting gig:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/gig/:gigId", upload.array("images", 5), async (req, res) => {
  const { gigId } = req.params;
  const { title, description, type, reward, expiresAt, date, roomId } =
    req.body;
  const imageFiles = req.files as Express.Multer.File[];

  try {
    const id = gigId;
    if (!id) return res.status(400).json({ message: "Invalid gig ID" });

    const existingGig = await prisma.gig.findUnique({ where: { id } });
    if (!existingGig) return res.status(404).json({ message: "Gig not found" });

    const data: any = {
      title: title?.trim() || existingGig.title,
      description: description?.trim() || existingGig.description,
      type: type?.trim() || existingGig.type,
      reward: reward ?? existingGig.reward,
      date: date ? new Date(date) : existingGig.date,
      expiresAt: expiresAt ? new Date(expiresAt) : existingGig.expiresAt,
      imageUrls:
        imageFiles && imageFiles.length > 0
          ? imageFiles.map((f) => f.filename)
          : existingGig.imageUrls,
    };

    if (roomId === null) {
      data.roomId = null;
    } else if (roomId !== undefined) {
      const rId = roomId;
      if (rId) {
        const roomExists = await prisma.mapRoom.findUnique({
          where: { id: rId },
        });
        if (!roomExists) {
          return res.status(404).json({ message: "Linked room not found" });
        }
        data.roomId = rId;
      }
    }

    const updatedGig = await prisma.gig.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, username: true, name: true, image: true },
        },
        room: { select: { id: true, name: true, type: true } },
      },
    });

    res.json({ message: "Gig updated successfully", gig: updatedGig });
  } catch (err) {
    console.error("Error editing gig:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
