// For React Query to determine a query has errored,
// the query function must throw. Any error that is
// thrown in the query function will be persisted on
// the error state of the query.

import {
  handleNewDraftsGoogle,
  handleNewThreadsGoogle,
  handleNewThreadsOutlook,
} from "../../../lib/sync";
import { getAccessToken } from "../../accessToken";
import {
  list as gList,
  listDrafts as gListDrafts,
} from "./reactQueryHelperFunctions";
import { list as mList } from "../../outlook/reactQuery/reactQueryHelperFunctions";
import _ from "lodash";

// Note: must have query param. we don't have an "all mail" folder. queryParam is a string like "labelIds=STARRED"
export const getThreadsExhaustive = async (
  email: string,
  provider: "google" | "outlook",
  queryParam: string,
  outlookLabelIds: string[], // LabelIds to append to threads on Outlook fetch
  pageToken?: string
) => {
  const accessToken = await getAccessToken(email);
  if (!accessToken) {
    throw Error("Error getting access token");
  }

  if (provider === "google") {
    const listThreadsResponse = await gList(accessToken, queryParam, pageToken);

    const nextPageToken = listThreadsResponse.nextPageToken;
    const threadIds =
      listThreadsResponse.threads?.map((thread) => thread.id) || [];

    if (threadIds.length > 0) {
      await handleNewThreadsGoogle(accessToken, email, threadIds);
    }

    // if (nextPageToken) {
    //   await getThreadsExhaustive(
    //     email,
    //     provider,
    //     queryParam,
    //     outlookLabelIds,
    //     nextPageToken
    //   );
    // }
    return nextPageToken;
  } else if (provider === "outlook") {
    const listThreadsResponse = await mList(accessToken, queryParam, pageToken);

    const nextPageToken = listThreadsResponse.nextPageToken;
    const threadIds = _.uniq(
      listThreadsResponse.value.map((thread) => thread.conversationId)
    );

    if (threadIds.length > 0) {
      await handleNewThreadsOutlook(
        accessToken,
        email,
        threadIds,
        outlookLabelIds
      );
    }

    // if (nextPageToken) {
    //   await getThreadsExhaustive(
    //     email,
    //     provider,
    //     queryParam,
    //     outlookLabelIds,
    //     nextPageToken
    //   );
    // }
    return nextPageToken;
  }

  return "";
};

export const getDraftsExhaustive = async (
  email: string,
  provider: "google" | "outlook",
  queryParam: string,
  outlookLabelIds: string[], // LabelIds to append to threads on Outlook fetch
  pageToken?: string
) => {
  const accessToken = await getAccessToken(email);
  if (!accessToken) {
    throw Error("Error getting access token");
  }

  if (provider === "google") {
    const listThreadsResponse = await gListDrafts(accessToken, pageToken);

    const nextPageToken = listThreadsResponse.nextPageToken;
    const threadIds =
      listThreadsResponse.drafts?.map((thread) => thread.id) || [];

    if (threadIds.length > 0) {
      await handleNewDraftsGoogle(accessToken, email, threadIds);
    }

    return nextPageToken;
  } else if (provider === "outlook") {
    // Same as get threads exhaustive for outlook
    const listThreadsResponse = await mList(accessToken, queryParam, pageToken);

    const nextPageToken = listThreadsResponse.nextPageToken;
    const threadIds = _.uniq(
      listThreadsResponse.value.map((thread) => thread.conversationId)
    );

    if (threadIds.length > 0) {
      await handleNewThreadsOutlook(
        accessToken,
        email,
        threadIds,
        outlookLabelIds
      );
    }

    return nextPageToken;
  }
};
