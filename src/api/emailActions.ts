import { dLog } from "../lib/noProd";
import { getJWTHeaders } from "./authHeader";
import { SPEEDFORCE_API_URL } from "./constants";

export const unsubscribe = async (unsubscribeUrl: string) => {
  let error = null;

  const authHeader = await getJWTHeaders();

  try {
    const response = await fetch(
      SPEEDFORCE_API_URL +
        "/emailActions/unsubscribe" +
        `?unsubscribeUrl=${unsubscribeUrl}`,
      {
        method: "GET",
        headers: {
          ...authHeader,
        },
      }
    );

    if (!response.ok) {
      error = "Failed to unsubscribe from mailing list";
    }
  } catch (e) {
    dLog("error", {
      message: "Failed to unsubscribe from mailing list. Caught error",
      location: "unsubscribe",
      error: e,
    });
    error = "Failed to unsubscribe from mailing list";
  }

  return { error };
};

export const newEvent = async (
  provider: string,
  eventName: string,
  data: object | null = null
) => {
  if (process.env.NODE_ENV === "development") return;
  const authHeader = await getJWTHeaders();

  const response = await fetch(SPEEDFORCE_API_URL + "/emailActions/newEvent", {
    method: "POST",
    headers: {
      ...authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventName,
      provider,
      data,
    }),
  });

  if (!response.ok) {
    return { error: "Error inserting new event" };
  }

  return {};
};
