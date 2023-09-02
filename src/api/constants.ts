export const SPEEDFORCE_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://preprod.api.speedforce.me"
    : "http://localhost:8080";

export const ID_INBOX = "ID_INBOX";
export const ID_SENT = "ID_SENT";
export const ID_DRAFTS = "ID_DRAFTS";
export const ID_TRASH = "ID_TRASH";
export const ID_SPAM = "ID_SPAM";
export const ID_STARRED = "ID_STARRED";