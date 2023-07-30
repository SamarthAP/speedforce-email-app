export const SPEEDFORCE_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://preprod.api.speedforce.me"
    : "https://preprod.api.speedforce.me";
