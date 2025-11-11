import express from "express";
import cors from "cors";
import userRoutes from "./routes/user";
import postRoutes from "./routes/posts";
import mapRoutes from '@maps';
import searchRoutes from "./routes/search"
import globalRoutes from "./routes/global";
import chatRoutes from "@chats"
import networkRoutes from "./routes/network"
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/user", userRoutes);
app.use("/", postRoutes);
app.use('/map', mapRoutes);
app.use("/search", searchRoutes); 
app.use("/global", globalRoutes); 
app.use("/chat", chatRoutes); 
app.use("/network", networkRoutes); 

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
