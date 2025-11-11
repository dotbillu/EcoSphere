import { API_BASE_URL } from "./constants";

// Helper function to build image URLs
export const getImageUrl = (path: string | null | undefined) => {
  if (!path) return "/default-placeholder.png";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}/uploads/${path}`;
};
