import { WatchResponseType } from "../../model/notifications";
import { getAccessToken } from "../../accessToken";

export const watch = async (email: string) => {
  const accessToken = await getAccessToken(email);

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
