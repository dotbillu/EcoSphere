import express from "express";
import cors from "cors";
import userRoutes from "./routes/user";
import postRoutes from "./routes/posts";
import mapRoutes from './routes/map';
import networkRoutes from "./routes/network";
import searchRoutes from "./routes/search"
import globalRoutes from "./routes/global";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/user", userRoutes);
app.use("/", postRoutes);
app.use('/map', mapRoutes);
app.use("/network", networkRoutes); 
app.use("/search", searchRoutes); 
app.use("/global", globalRoutes); 
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
