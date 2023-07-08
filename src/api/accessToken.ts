import { db } from "../lib/db";
import { refreshAccessToken } from "./auth";

export const getAccessToken = async (email: string) => {
  const emailInfo = await db.emails.get({ email });

  if (!emailInfo) {
    return "";
  }

  // if token is expired or about to expire (2 minutes), refresh it
  if (new Date().getTime() > emailInfo.expiresAt - 1000 * 60 * 2) {
    const clientId = await window.electron.ipcRenderer.invoke(
      "store-get",
      "client.id"
    );

    const { data, error } = await refreshAccessToken(
      emailInfo.email,
      emailInfo.provider,
      clientId
    );

    if (error || !data) {
      return "";
    }

    await db.emails.update(emailInfo.email, {
      accessToken: data.accessToken,
      expiresAt: data.expiresAt,
    });

    return data.accessToken;
  } else {
    return emailInfo.accessToken;
  }
};
