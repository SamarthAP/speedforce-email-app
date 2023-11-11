import { getAccessToken } from "../accessToken";
import { EventsListResponse } from "../model/gcal.interface";

export const listPrimaryCalendarEvents = async (
  email: string,
  startDateTime: string,
  endDateTime: string
) => {
  let data: EventsListResponse | null = null;
  let error: string | null = null;

  const accessToken = await getAccessToken(email);
  if (!accessToken) {
    return { data, error: "No access token found" };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startDateTime}&timeMax=${endDateTime}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      error = "Error getting primary calendar events";
    } else {
      data = await response.json();
    }
  } catch (e) {
    error = "Error getting primary calendar events";
  }

  return { data, error };
};
