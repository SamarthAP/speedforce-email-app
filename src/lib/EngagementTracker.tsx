import { dLog } from "./noProd";
import { getJWTHeaders } from "../api/authHeader";
import { SPEEDFORCE_API_URL } from "../api/constants";

export async function trackEmailSent(userId: string) {
  await trackEvent(userId, "EMAIL_SENT");
}

export async function trackEmailReplied(userId: string) {
  await trackEvent(userId, "EMAIL_REPLIED");
}

export async function trachEmailReplyAll(userId: string) {
  await trackEvent(userId, "EMAIL_REPLY_ALL");
}

export async function trackEmailForwarded(userId: string) {
  await trackEvent(userId, "EMAIL_FORWARDED");
}

export async function trackEmailDeleted(userId: string) {
  await trackEvent(userId, "EMAIL_DELETED");
}

export async function trackEmailMarkedDone(userId: string) {
  await trackEvent(userId, "EMAIL_MARKED_DONE");
}

export async function trackEmailStarred(userId: string) {
  await trackEvent(userId, "EMAIL_STARRED");
}

export async function trackFeedbackButtonInteraction(userId: string) {
  await trackEvent(userId, "FEEDBACK_BUTTON_INTERACTION");
}

export async function trackEmailViewed(userId: string) {
  await trackEvent(userId, "EMAIL_VIEWED");
}

async function trackEvent(userId: string, action: string) {
  const authHeader = await getJWTHeaders();
  const dateNumber = new Date().getTime();

  let data = null;
  let error = null;

  const eventData = {
    user_id: userId,
    event_type: action,
    time_stamp: dateNumber,
  };

  try {
    const res: Response = await fetch(
      SPEEDFORCE_API_URL + "/engagementMetrics",
      {
        method: "POST",
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!res.ok) {
      dLog("error", {
        message: `Error saving metric ${action}`,
        location: "engagementTracker",
        error: res,
      });
      error = `Error saving metric ${action}`;
    } else {
      data = await res.json();
    }
  } catch (e) {
    dLog("error", {
      message: `Error saving metric ${action}`,
      location: "engagementTracker",
      error: e,
    });
    error = `Error saving metric ${action}`;
  }

  return { data, error };
}
