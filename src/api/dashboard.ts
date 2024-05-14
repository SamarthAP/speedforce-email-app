import { getJWTHeaders } from "./authHeader";
import { SPEEDFORCE_API_URL } from "./constants";

export const listQuickReplies = async (email: string) => {
  const authHeader = await getJWTHeaders();
  const res = await fetch(
    `${SPEEDFORCE_API_URL}/dashboard/quickReplies/list?email=${email}`,
    {
      method: "GET",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    return { data: null, error: "Error loading quick replies" };
  } else {
    return { data: await res.json(), error: null };
  }
};
