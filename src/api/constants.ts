export const SPEEDFORCE_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.speedforce.me"
    : "https://preprod.api.speedforce.me";

export const SPEEDFORCE_WS_URL =
  process.env.NODE_ENV === "production"
    ? "ws://localhost:8080"
    : "ws://localhost:8080";

export const ID_INBOX = "ID_INBOX";
export const ID_SENT = "ID_SENT";
export const ID_DRAFTS = "ID_DRAFTS";
export const ID_TRASH = "ID_TRASH";
export const ID_SPAM = "ID_SPAM";
export const ID_STARRED = "ID_STARRED";
export const ID_DONE = "ID_DONE";
