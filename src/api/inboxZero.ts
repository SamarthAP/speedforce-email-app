import { getJWTHeaders } from "./authHeader";
import { SPEEDFORCE_API_URL } from "./constants";

export interface DailyImageData {
  date: string; // YYYY-MM-DD
  url: string;
}

export const getDailyImage = async () => {
  let data: DailyImageData | null = null;
  let error: string | null = null;

  const authHeader = await getJWTHeaders();

  // get current date in YYYY-MM-DD format
  const date = new Date().toISOString().split("T")[0];

  try {
    const res: Response = await fetch(
      SPEEDFORCE_API_URL + "/inboxZero/getDailyImage?date=" + date,
      {
        method: "GET",
        headers: {
          ...authHeader,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching daily image";
    } else {
      const responseData = await res.json();
      data = {
        date: responseData[0].date,
        url: responseData[0].image_url,
      };
    }
  } catch (e) {
    error = "Error fetching daily image";
  }

  return { data, error };
};
