import { getJWTHeaders } from "./auth";
import { SPEEDFORCE_API_URL } from "./constants";

export interface ResponseData {
  thread_id: string;
  response: string;
}

export interface ListQuickRepliesData {
  responses: ResponseData[];
}

export const listQuickReplies = async (email: string) => {
  const authHeader = await getJWTHeaders();
  let data: ListQuickRepliesData = {
    responses: [],
  };
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      SPEEDFORCE_API_URL + "/dashboard/quickReplies/list" + `?email=${email}`,
      {
        headers: {
          ...authHeader,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching quick replies";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error fetching quick replies";
  }

  return { data, error };
};
