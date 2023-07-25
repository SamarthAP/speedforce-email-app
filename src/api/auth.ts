import { getJWTHeaders } from "./authHeader";
import { SPEEDFORCE_API_URL } from "./constants";

interface GetAuthURLDataType {
  url: string;
}

// provider can be 'google' or 'outlook'
export const getAuthURL = async (provider: string) => {
  const authHeader = await getJWTHeaders();
  let data: GetAuthURLDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      SPEEDFORCE_API_URL + "/auth/getAuthURL?provider=" + provider,
      {
        headers: {
          ...authHeader,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching auth url";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error fetching auth url";
  }

  return { data, error };
};

interface ExchangeCodeForTokenDataType {
  email: string;
  provider: "google" | "outlook";
  accessToken: string;
  expiresAt: number;
}

export const exchangeCodeForToken = async (
  clientId: string,
  provider: "google" | "outlook",
  code: string
) => {
  const authHeader = await getJWTHeaders();
  let data: ExchangeCodeForTokenDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      SPEEDFORCE_API_URL + "/auth/exchangeCodeForToken",
      {
        method: "POST",
        headers: {
          ...authHeader,
          "speedforce-client-id": clientId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          code,
        }),
      }
    );

    if (!res.ok) {
      error = "Error exchanging code for token";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error exchanging code for token";
  }
  return { data, error };
};

interface RefreshAccessTokenDataType {
  accessToken: string;
  expiresAt: number;
}

export const refreshAccessToken = async (
  email: string,
  provider: "google" | "outlook",
  clientId: string
) => {
  const authHeader = await getJWTHeaders();
  let data: RefreshAccessTokenDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      SPEEDFORCE_API_URL + "/auth/refreshAccessToken",
      {
        method: "POST",
        headers: {
          ...authHeader,
          "speedforce-client-id": clientId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          provider,
        }),
      }
    );

    if (!res.ok) {
      error = "Error refreshing access token";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error refreshing access token";
  }
  return { data, error };
};
