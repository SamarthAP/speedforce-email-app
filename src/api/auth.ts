import { SPEEDFORCE_API_URL } from "./constants";

import supabase from "../lib/supabase";
export const getJWTHeaders = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return {
      Authorization: "",
    };
  }

  const jwt = data?.session?.access_token;

  return {
    Authorization: `Bearer ${jwt}`,
  };
};

interface GetAuthURLDataType {
  url: string;
}

// provider can be 'google' or 'outlook'
export const getAuthURL = async (provider: "google" | "outlook") => {
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

// provider can be 'google' or 'outlook'
export const getReAuthURL = async (
  email: string,
  provider: "google" | "outlook"
) => {
  const authHeader = await getJWTHeaders();
  let data: GetAuthURLDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      SPEEDFORCE_API_URL +
        `/auth/getReAuthURL?email=${email}&provider=${provider}`,
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
  provider: "google" | "outlook"
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
