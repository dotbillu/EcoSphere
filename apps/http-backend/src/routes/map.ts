import { Router } from "express";
import { prisma } from "../lib/prisma";
import { upload } from "../multer"; // Assuming your multer config is here
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

// --- GET ALL ROOMS (for map) ---
router.get("/rooms", async (req, res) => {
  try {
    const rooms = await prisma.mapRoom.findMany({
      // Select only the data needed for map pins to keep the payload small
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        type: true,
        imageUrl: true,
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
      // Select only the data needed for map pins
      select: {
        id: true,
        title: true,
        description: true,
        latitude: true,
        longitude: true,
        date: true,
        type: true,
        // --- FIX 1 ---
        // 'imageUrls' is a String array, not a relation.
        // You can't use { take: 1 } here. Select 'true' to get the array.
        imageUrls: true,
      },
    });

    // --- FIX 1 (continued) ---
    // We process the result to only send the first image, as intended.
    const processedGigs = gigs.map((gig) => ({
      ...gig,
      imageUrls: gig.imageUrls.slice(0, 1), // Take only the first image
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

  // Validation
  if (!name || !latitude || !longitude || !creatorId) {
    return res.status(400).json({
      message: "Name, latitude, longitude, and creatorId are required",
    });
  }

  try {
    // Convert FormData strings to numbers
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const cId = parseInt(creatorId, 10);

    if (isNaN(lat) || isNaN(lon) || isNaN(cId)) {
      return res
        .status(400)
        .json({ message: "Invalid number format for coordinates or creatorId" });
    }

    const newRoom = await prisma.mapRoom.create({
      data: {
        name,
        description,
        latitude: lat,
        longitude: lon,
        type,
        creatorId: cId,
        imageUrl: imageFile ? imageFile.filename : null,
      },
    });
    res.status(201).json(newRoom);
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- CREATE A NEW GIG ---
router.post("/gig", upload.array("images", 5), async (req, res) => {
  const { title, description, latitude, longitude, date, type, creatorId, roomId } =
    req.body;
  const imageFiles = req.files as Express.Multer.File[];

  // Validation
  if (!title || !latitude || !longitude || !creatorId) {
    return res.status(400).json({
      message: "Title, latitude, longitude, and creatorId are required",
    });
  }

  try {
    // Convert FormData strings to appropriate types
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const cId = parseInt(creatorId, 10);

    // Optional fields
    const rId = roomId ? parseInt(roomId, 10) : null;
    const gigDate = date ? new Date(date) : null;

    // --- FIX 2 ---
    // The check 'isNaN(rId)' fails because 'rId' can be 'null', and isNaN() expects a 'number'.
    // The new check '(rId !== null && isNaN(rId))' is type-safe.
    if (isNaN(lat) || isNaN(lon) || isNaN(cId) || (rId !== null && isNaN(rId))) {
      return res.status(400).json({
        message:
          "Invalid number format for coordinates, creatorId, or roomId",
      });
    }

    const imageUrls = imageFiles ? imageFiles.map((file) => file.filename) : [];

    // Build data object, handling optional roomId
    const data: any = {
      title,
      description,
      latitude: lat,
      longitude: lon,
      creatorId: cId,
      type,
      date: gigDate,
      imageUrls,
    };

    if (rId && !isNaN(rId)) { // Added !isNaN check here for safety
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
  const { userId } = req.body; // We need to know *who* is joining

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

    // Use Prisma's 'connect' to add a user to the many-to-many 'members' list
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
  const { userId } = req.body; // We need to know *who* is leaving

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

    // Use Prisma's 'disconnect' to remove a user from the 'members' list
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

// --- (NEW) DELETE A ROOM ---
router.delete("/room/:roomId", async (req, res) => {
  const { roomId } = req.params;

  // TODO: Add user authentication here
  // You should verify that the user making this request
  // is the user who created the room.

  try {
    const rId = parseInt(roomId, 10);
    if (isNaN(rId)) {
      return res.status(400).json({ message: "Invalid Room ID" });
    }

    // We must delete related gigs and posts first, or update them
    // For simplicity, we'll just delete them.
    await prisma.gig.deleteMany({ where: { roomId: rId } });
    await prisma.post.deleteMany({ where: { roomId: rId } });

    // Now delete the room
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

  // TODO: Add user authentication here

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
export default router;
