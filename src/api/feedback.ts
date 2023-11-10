import { dLog } from "../lib/noProd";
import { getJWTHeaders } from "./authHeader";
import { SPEEDFORCE_API_URL } from "./constants";

export interface FeedbackData {
  selectedEmail: string;
  emailProvider: string;
  text: {
    title: string;
    description: string;
  };
  attachments: File[];
  keepAnonymous: boolean;
}

export const saveFeedback = async (feedbackData: FeedbackData) => {
    let data = null;
    let error = null;
    const authHeader = await getJWTHeaders();

  try {
    const formData = new FormData();
    formData.append('selectedEmail', feedbackData.selectedEmail);
    formData.append('emailProvider', feedbackData.emailProvider);
    formData.append('title', feedbackData.text.title);
    formData.append('description', feedbackData.text.description);
    formData.append('keepAnonymous', feedbackData.keepAnonymous.toString());

    feedbackData.attachments.forEach((file, index) => {
      formData.append(`attachment_${index}`, file);
    });

    const res: Response = await fetch(
      SPEEDFORCE_API_URL + "/feedback/saveFeedback",
      {
        method: "POST",
        headers: {
          ...authHeader,
        },
        body: formData,
      }
    );
    
    if (!res.ok) {
      dLog("error", {
        message: "Error saving feedback - response not ok",
        location: "saveFeedback",
        error: res,
      });
      error = "Error saving feedback";
    } else {
      data = await res.json();
    }

  } catch (e) {
    dLog("error", {
      message: "!Error saving feedback - caught error",
      location: "saveFeedback",
      error: e,
    });
    error = "Error saving feedback";
  }

  return { data, error };
}