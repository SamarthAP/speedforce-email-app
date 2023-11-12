import { FOLDER_IDS } from "../api/constants";
import { NotificationMessageType } from "../api/model/notifications";
import { db } from "./db";
import { partialSync } from "./sync";

export async function handleMessage(event: MessageEvent) {
  const data: NotificationMessageType = JSON.parse(event.data);

  if (data.messageData.provider === "google") {
    const metadata = await db.googleMetadata
      .where("email")
      .equals(data.messageData.email)
      .first();
    if (!metadata) return;

    if (parseInt(data.messageData.historyId) > parseInt(metadata.historyId)) {
      await partialSync(data.messageData.email, data.messageData.provider, {
        folderId: FOLDER_IDS.INBOX,
      });
    }

    // wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } else {
    // TODO: handle outlook notifications
  }
}
