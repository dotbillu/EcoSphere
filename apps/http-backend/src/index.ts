import express from "express";
import cors from "cors";
import userRoutes from "./routes/user";
import postRoutes from "./routes/posts";
import mapRoutes from './routes/map'
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/user", userRoutes);
app.use("/", postRoutes);
app.use('/map',mapRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

