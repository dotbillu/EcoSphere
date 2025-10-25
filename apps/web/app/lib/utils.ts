// Helper function to build image URLs
export const getImageUrl = (path: string | null | undefined) => {
  if (!path) return "/default-placeholder.png"; 
  if (path.startsWith("http")) return path;
  return `http://localhost:4000/uploads/${path}`;
};
