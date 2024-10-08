import { WatchResponseType } from "../../model/notifications";

export const watch = async (accessToken: string, email: string) => {
  let data: WatchResponseType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/${email}/watch`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicName: "projects/speedforcedotme/topics/gmail-notifications", // TODO: change to env var
        }),
      }
    );

    if (!res.ok) {
      error = "Error watching inbox";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error watching inbox: " + e;
  }

  return { data, error };
};

export const stop = async (accessToken: string, email: string) => {
  let data: any = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/${email}/stop`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      error = "Error stopping notifications";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error stopping notifications: " + e;
  }

  return { data, error };
};
