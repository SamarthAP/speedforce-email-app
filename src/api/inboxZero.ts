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

  // get current date in YYYY-MM-DD format but don't use ISO string because it's in UTC
  const currentDate = new Date();

  // Extract year, month, and date
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Adding 1 because month index starts from 0
  const day = String(currentDate.getDate()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}`;

  try {
    const res: Response = await fetch(
      SPEEDFORCE_API_URL + "/inboxZero/getDailyImage?date=" + formattedDate,
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
