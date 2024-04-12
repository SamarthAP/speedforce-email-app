import { db } from "../db";
import { dLog } from "../noProd";

export const clearEmailFromDb = async (email: string) => {
  try {
    // remaining emails when this email is deleted
    const emails = (await db.emails.toArray()).filter((e) => e.email !== email);

    if (emails.length === 0) {
      // Clear db if this is the only remaining email
      db.tables.forEach((table) => void table.clear());
    } else {
      const selectedEmail = await db.selectedEmail.get(1);
      const emailThreads = (
        await db.emailThreads.where("email").equals(email).toArray()
      ).map((t) => t.id);

      void db.emails.where("email").equals(email).delete();
      void db.emailThreads.where("id").anyOf(emailThreads).delete();
      void db.messages.where("threadId").anyOf(emailThreads).delete();

      // If the selected email is being deleted, select the first remaining email
      if (selectedEmail?.email === email) {
        void db.selectedEmail.put({
          id: 1,
          email: emails[0].email,
          provider: emails[0].provider,
          inboxZeroStartDate: emails[0].inboxZeroStartDate,
        });
      }
    }
  } catch (e) {
    dLog(e);
    return e;
  }

  return null;
};

export const clearAllEmailsFromDb = async () => {
  try {
    db.tables.forEach((table) => void table.clear());
  } catch (e) {
    dLog(e);
    return e;
  }

  return null;
};
