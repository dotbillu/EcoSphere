import { Router } from "express";
import { prisma } from "../lib/prisma";
import { upload } from "../multer"; 
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

// --- GET ALL ROOMS (for map) ---
router.get("/rooms", async (req, res) => {
  try {
    const rooms = await prisma.mapRoom.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        type: true,
        imageUrl: true,
        creatorId: true,
      },
    });
    res.json(rooms);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- GET ALL GIGS (for map) ---
router.get("/gigs", async (req, res) => {
  try {
    const gigs = await prisma.gig.findMany({
      where: {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }, 
        ],
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
        creatorId: true,
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

// --- CREATE A NEW MAP ROOM ---
router.post("/room", upload.single("image"), async (req, res) => {
  const { name, description, latitude, longitude, type, creatorId } = req.body;
  const imageFile = req.file;

  if (!name || !latitude || !longitude || !creatorId) {
    return res.status(400).json({
      message: "Name, latitude, longitude, and creatorId are required.",
    });
  }

  try {
    const lat = Number(latitude);
    const lon = Number(longitude);
    const cId = Number(creatorId);

    if (isNaN(lat) || isNaN(lon) || isNaN(cId)) {
      return res.status(400).json({
        message: "Invalid coordinates or creatorId format.",
      });
    }

    const creator = await prisma.user.findUnique({ where: { id: cId } });
    if (!creator) {
      return res.status(404).json({ message: "Creator not found." });
    }

    const newRoom = await prisma.mapRoom.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        latitude: lat,
        longitude: lon,
        type: type?.trim() || null,
        creatorId: cId,
        imageUrl: imageFile ? `/uploads/${imageFile.filename}` : null,


        members: {
          connect: { id: cId },
        },
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        members: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({
      message: "Map room created successfully.",
      room: newRoom,
    });
  } catch (err) {
    console.error("Error creating map room:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});
// --- CREATE A NEW GIG ---
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
    const cId = parseInt(creatorId, 10); 

    const rId = roomId ? parseInt(roomId, 10) : null;
    const gigDate = date ? new Date(date) : null; 
    const gigExpiresAt = expiresAt ? new Date(expiresAt) : null;

    if (
      isNaN(lat) ||
      isNaN(lon) ||
      isNaN(cId) ||
      (rId !== null && isNaN(rId))
    ) {
      return res.status(400).json({
        message: "Invalid number format for coordinates, creatorId, or roomId",
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
      expiresAt: gigExpiresAt, // Pass the new Date object or null
    };

    if (rId && !isNaN(rId)) {
      data.room = { connect: { id: rId } };
    }

    const newGig = await prisma.gig.create({ data });
    res.status(201).json(newGig);
  } catch (err) {
    console.error("Error creating gig:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
// --- (NEW) JOIN A ROOM ---
router.post("/room/:roomId/join", async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const rId = parseInt(roomId, 10);
    const uId = parseInt(userId, 10);

    if (isNaN(rId) || isNaN(uId)) {
      return res
        .status(400)
        .json({ message: "Invalid ID format for room or user" });
    }

    await prisma.mapRoom.update({
      where: { id: rId },
      data: {
        members: {
          connect: { id: uId },
        },
      },
    });

    res.status(200).json({ message: "User joined room successfully" });
  } catch (err) {
    console.error("Error joining room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- (NEW) LEAVE A ROOM ---
router.post("/room/:roomId/leave", async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body; 

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const rId = parseInt(roomId, 10);
    const uId = parseInt(userId, 10);

    if (isNaN(rId) || isNaN(uId)) {
      return res
        .status(400)
        .json({ message: "Invalid ID format for room or user" });
    }

    await prisma.mapRoom.update({
      where: { id: rId },
      data: {
        members: {
          disconnect: { id: uId },
        },
      },
    });

    res.status(200).json({ message: "User left room successfully" });
  } catch (err) {
    console.error("Error leaving room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ---  DELETE A ROOM ---
router.delete("/room/:roomId", async (req, res) => {
  const { roomId } = req.params;

  try {
    const rId = parseInt(roomId, 10);
    if (isNaN(rId)) {
      return res.status(400).json({ message: "Invalid Room ID" });
    }

    await prisma.gig.deleteMany({ where: { roomId: rId } });
    await prisma.post.deleteMany({ where: { roomId: rId } });

    await prisma.mapRoom.delete({
      where: { id: rId },
    });

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error("Error deleting room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- (NEW) DELETE A GIG ---
router.delete("/gig/:gigId", async (req, res) => {
  const { gigId } = req.params;


  try {
    const gId = parseInt(gigId, 10);
    if (isNaN(gId)) {
      return res.status(400).json({ message: "Invalid Gig ID" });
    }

    await prisma.gig.delete({
      where: { id: gId },
    });

    res.status(200).json({ message: "Gig deleted successfully" });
  } catch (err) {
    console.error("Error deleting gig:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- EDIT A ROOM ---
router.put("/room/:roomId", upload.single("image"), async (req, res) => {
  const { roomId } = req.params;
  const { name, description, type, gigIds } = req.body; 
  const imageFile = req.file;

  try {
    const id = roomId ? parseInt(roomId, 10) : NaN;
    if (isNaN(id)) return res.status(400).json({ message: "Invalid room ID" });

    const existingRoom = await prisma.mapRoom.findUnique({ where: { id } });
    if (!existingRoom)
      return res.status(404).json({ message: "Room not found" });

    const data: any = {
      name: name?.trim() || existingRoom.name,
      description: description?.trim() || existingRoom.description,
      type: type?.trim() || existingRoom.type,
      imageUrl: imageFile
        ? `/uploads/${imageFile.filename}`
        : existingRoom.imageUrl,
    };

    if (gigIds && Array.isArray(gigIds)) {
      data.gigs = {
        set: [], 
        connect: gigIds.map((gId) => ({ id: parseInt(gId, 10) })),
      };
    }

    const updatedRoom = await prisma.mapRoom.update({
      where: { id },
      data,
      include: {
        gigs: { select: { id: true, title: true } },
      },
    });

    res.json({ message: "Room updated successfully", room: updatedRoom });
  } catch (err) {
    console.error("Error editing room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- EDIT A GIG ---
router.put("/gig/:gigId", upload.array("images", 5), async (req, res) => {
  const { gigId } = req.params;
  const { title, description, type, reward, expiresAt, date, roomId } =
    req.body;
  const imageFiles = req.files as Express.Multer.File[];

  try {
    const id = gigId ? parseInt(gigId, 10) : NaN;
    if (isNaN(id)) return res.status(400).json({ message: "Invalid gig ID" });

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

    if (roomId) {
      const rId = parseInt(roomId, 10);
      if (!isNaN(rId)) data.room = { connect: { id: rId } };
    }

    const updatedGig = await prisma.gig.update({
      where: { id },
      data,
      include: {
        room: { select: { id: true, name: true } },
      },
    });

    res.json({ message: "Gig updated successfully", gig: updatedGig });
  } catch (err) {
    console.error("Error editing gig:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
