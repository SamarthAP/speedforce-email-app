import { db } from "../lib/db";
import { runNotProd } from "../lib/noProd";
import { refreshAccessToken } from "./auth";
import toast from "react-hot-toast";

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
