import express from "express";
import cors from "cors";
import userRoutes from "./routes/user";
import postRoutes from "@posts";
import mapRoutes from "@maps";
import searchRoutes from "./routes/search";
import globalRoutes from "./routes/global";
import chatRoutes from "@chats";
require("dotenv").config();

const app = express();
const PORT = process.env.HTTP_PORT;

app.use(cors());
app.use(express.json());

app.use("/user", userRoutes);
app.use("/feed", postRoutes);
app.use("/map", mapRoutes);
app.use("/search", searchRoutes);
app.use("/global", globalRoutes);
app.use("/chat", chatRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
