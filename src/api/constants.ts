export const SPEEDFORCE_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.speedforce.me"
    : "http://localhost:8080";

export const SPEEDFORCE_WS_URL =
  process.env.NODE_ENV === "production"
    ? "wss://ws.speedforce.me"
    : "wss://preprod.ws.speedforce.me";

export const SPEEDFORCE_WS_HTTP_URL =
  process.env.NODE_ENV === "production"
    ? "https://ws.speedforce.me"
    : "https://preprod.ws.speedforce.me";

export const FOLDER_IDS = {
  INBOX: "ID_INBOX",
  SENT: "ID_SENT",
  DRAFTS: "ID_DRAFTS",
  TRASH: "ID_TRASH",
  SPAM: "ID_SPAM",
  STARRED: "ID_STARRED",
  DONE: "ID_DONE",
};
