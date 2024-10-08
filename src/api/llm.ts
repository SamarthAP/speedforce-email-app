import { dLog } from "../lib/noProd";
import { getJWTHeaders } from "./authHeader";
import { SPEEDFORCE_API_URL } from "./constants";

export interface SummarizeThreadInfo {
  messages: {
    to: string;
    from: string;
    date: string;
    emailBody: string;
  }[];
  subject: string;
}

export const summarizeThread = async (
  threadInfo: SummarizeThreadInfo,
  email: string
) => {
  const authHeader = await getJWTHeaders();
  let data = null;
  let error = null;

  try {
    const res: Response = await fetch(
      SPEEDFORCE_API_URL + "/llm/summarizeThread",
      {
        method: "POST",
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ thread: threadInfo, email }),
      }
    );

    if (!res.ok) {
      dLog("error", {
        message: "Error summarizing thread - response not ok",
        location: "summarizeThread",
        error: res,
      });
      error = "Error summarizing thread";
    } else {
      const jsonData: {
        summary: {
          role: string;
          content: string;
        };
      } = await res.json();

      data = {
        summary: {
          role: jsonData.summary.role,
          content: jsonData.summary.content,
        },
      };
    }
  } catch (e) {
    dLog("error", {
      message: "Error summarizing thread - caught error",
      location: "summarizeThread",
      error: e,
    });
    error = "Error summarizing thread";
  }

  return { data, error };
};

export const hybridSearch = async (email: string, query: string) => {
  const authHeader = await getJWTHeaders();

  let data = null;
  let error = null;

  try {
    const res: Response = await fetch(
      SPEEDFORCE_API_URL + "/llm/hybridSearch",
      {
        method: "POST",
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, query }),
      }
    );

    if (!res.ok) {
      dLog("error", {
        message: "Error hybrid searching - response not ok",
        location: "hybridSearch",
        error: res,
      });
      error = "Error hybrid searching";
    } else {
      const jsonData: {
        thread_id: string;
        message_id: string;
        final_rank: string;
      }[] = await res.json();

      data = jsonData;
    }
  } catch (e) {
    dLog("error", {
      message: "Error hybrid searching - caught error",
      location: "hybridSearch",
      error: e,
    });
    error = "Error hybrid searching";
  }

  return { data, error };
};
