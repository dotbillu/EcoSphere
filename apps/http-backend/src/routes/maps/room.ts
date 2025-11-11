import { Router } from "express";
import { prisma } from "@lib/prisma";
import { upload } from "@multer";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

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
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });
    res.json(rooms);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

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

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        message: "Invalid coordinates format.",
      });
    }

    const creator = await prisma.user.findUnique({ where: { id: creatorId } });
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
        creatorId: creatorId,
        imageUrl: imageFile ? imageFile.filename : null,
        members: {
          connect: { id: creatorId },
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, username: true, image: true },
        },
        members: {
          select: { id: true, name: true, username: true, image: true },
        },
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

router.post("/room/:roomId/join", async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const updatedRoom = await prisma.mapRoom.update({
      where: { id: roomId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, username: true, image: true },
        },
        members: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    res.status(200).json({
      message: "User joined room successfully",
      room: updatedRoom,
    });
  } catch (err) {
    console.error("Error joining room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/room/:roomId/leave", async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const updatedRoom = await prisma.mapRoom.update({
      where: { id: roomId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, username: true, image: true },
        },
        members: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    res.status(200).json({
      message: "User left room successfully",
      room: updatedRoom,
    });
  } catch (err) {
    console.error("Error leaving room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/room/:roomId", async (req, res) => {
  const { roomId } = req.params;
  try {
    if (!roomId) {
      return res.status(400).json({ message: "Invalid Room ID" });
    }
    await prisma.mapRoom.update({
      where: { id: roomId },
      data: {
        members: { set: [] },
        posts: { set: [] },
        gigs: { set: [] },
      },
    });
    await prisma.mapRoom.delete({
      where: { id: roomId },
    });
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error("Error deleting room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/room/:roomId", upload.single("image"), async (req, res) => {
  const { roomId } = req.params;
  const { name, description, type } = req.body;
  const imageFile = req.file;

  try {
    const id = roomId;
    if (!id) return res.status(400).json({ message: "Invalid room ID" });

    const existingRoom = await prisma.mapRoom.findUnique({ where: { id } });
    if (!existingRoom)
      return res.status(404).json({ message: "Room not found" });

    const data: any = {
      name: name?.trim() || existingRoom.name,
      description: description?.trim() || existingRoom.description,
      type: type?.trim() || existingRoom.type,
      imageUrl: imageFile ? imageFile.filename : existingRoom.imageUrl,
    };

    const updatedRoom = await prisma.mapRoom.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, name: true, username: true, image: true },
        },
        members: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    res.json({ message: "Room updated successfully", room: updatedRoom });
  } catch (err) {
    console.error("Error editing room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/room/:roomId", async (req, res) => {
  const { roomId } = req.params;
  try {
    const id = roomId;
    if (!id) return res.status(400).json({ message: "Invalid ID" });

    const room = await prisma.mapRoom.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, username: true, image: true },
        },
        members: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
