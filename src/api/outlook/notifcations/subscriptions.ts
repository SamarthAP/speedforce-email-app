import { OUTLOOK_API_URL } from "../constants";
import { OutlookSubscriptionType } from "../../model/notifications";
import { SPEEDFORCE_API_URL } from "../../constants";
import { getOutlookSubscriptionExpirationDateTime } from "../helpers";

export const list = async (accessToken: string) => {
  let data: OutlookSubscriptionType[] | null = null;
  let error: string | null = null;

  const res = await fetch(`${OUTLOOK_API_URL}/subscriptions`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    error = "Error fetching threads";
  } else {
    const resData = await res.json();
    data = resData.value;
  }

  return { data, error };
};

export const create = async (accessToken: string, email: string) => {
  let data: OutlookSubscriptionType | null = null;
  let error: string | null = null;

  const expirationDateTime = getOutlookSubscriptionExpirationDateTime();

  const res = await fetch(`${OUTLOOK_API_URL}/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      changeType: "created",
      notificationUrl: `${SPEEDFORCE_API_URL}/rt/subscription`,
      resource: `me/messages`,
      expirationDateTime: expirationDateTime,
      clientState: "OutlookNotification",
      latestSupportedTlsVersion: "v1_2",
    }),
  });

  console.log(res);
  if (!res.ok) {
    error = "Error creating subscription";
  } else {
    data = await res.json();
  }

  return { data, error };
};

export const updateExpirationDateTime = async (
  accessToken: string,
  subscriptionId: string,
  expirationDateTime: string
) => {
  let data: OutlookSubscriptionType | null = null;
  let error: string | null = null;

  const res = await fetch(
    `${OUTLOOK_API_URL}/subscriptions/${subscriptionId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expirationDateTime: expirationDateTime,
      }),
    }
  );

  if (!res.ok) {
    error = "Error updating subscription";
  } else {
    data = await res.json();
  }

  return { data, error };
};
