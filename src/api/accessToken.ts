import { db } from "../lib/db";
import { runNotProd } from "../lib/noProd";
import { refreshAccessToken } from "./auth";
import toast from "react-hot-toast";

const tokenPromises: Map<string, Promise<string>> = new Map();
const signInToastTimestamps: Map<string, number> = new Map();

// Toasts the user to sign in again only if the last toast was more than 10 seconds ago
const toastSignIn = (email: string) => {
  const lastToastTimestamp = signInToastTimestamps.get(email);
  const now = new Date().getTime();
  if (lastToastTimestamp && now - lastToastTimestamp < 60000) {
    return;
  }

  runNotProd(() => {
    toast("Error refreshing access token", {
      icon: "🐞",
    });
  });

  toast(
    `Please sign in to ${email} again. (Click Account Icon -> Click Add Account)`,
    {
      duration: 10000,
    }
  );
  signInToastTimestamps.set(email, now);
};

const fetchTokenFromServer = async (
  email: string,
  provider: "google" | "outlook",
  clientId: string
) => {
  const { data, error } = await refreshAccessToken(email, provider, clientId);
  if (error || !data) {
    toastSignIn(email);
    return null;
  }

  return data;
};

export const getAccessToken = async (email: string) => {
  const emailInfo = await db.emails.get({ email });
  if (!emailInfo) {
    return Promise.resolve("");
  }

  // if token is expired or about to expire (2 minutes), refresh it
  if (new Date().getTime() > emailInfo.expiresAt - 1000 * 60 * 2) {
    const clientId = await window.electron.ipcRenderer.invoke(
      "store-get",
      "client.id"
    );

    const existingPromise = tokenPromises.get(email);
    if (!existingPromise) {
      // Global promise to prevent multiple fetches for the same email
      const tokenPromise = fetchTokenFromServer(
        emailInfo.email,
        emailInfo.provider,
        clientId
      ).then(async (data) => {
        // Update dexie, delete promise and return token
        if (!data) {
          tokenPromises.delete(email);
          return "";
        }

        await db.emails.update(emailInfo.email, {
          accessToken: data.accessToken,
          expiresAt: data.expiresAt,
        });

        tokenPromises.delete(email);
        return data.accessToken;
      });

      tokenPromises.set(email, tokenPromise);
      return tokenPromise;
    } else {
      // Return token promise instead of reinvoking fetch
      return existingPromise;
    }
  } else {
    return Promise.resolve(emailInfo.accessToken);
  }
};
