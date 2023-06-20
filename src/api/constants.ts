export const SPEEDFORCE_API_URL =
  process.env.NODE_ENV === "production"
    ? "http://localhost:8080"
    : "http://localhost:8080";
