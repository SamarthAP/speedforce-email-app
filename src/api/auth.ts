import { getJWTHeaders } from "./authHeader";
import { SPEEDFORCE_API_URL } from "./constants";

interface GetAuthURLDataType {
  url: string;
  error: string;
}

// provider can be 'google' or 'outlook'
export const getAuthURL = async (provider: "google" | "outlook") => {
  const authHeader = await getJWTHeaders();
  let data: GetAuthURLDataType | null, error: string | null;

  try {
    const res: Response = await fetch(
      SPEEDFORCE_API_URL + "/auth/getAuthURL?provider=" + provider,
      {
        headers: {
          ...authHeader,
        },
      }
    );

    data = await res.json();
  } catch (e) {
    error = "Error fetching auth url";
  }
  return { data, error };
};
