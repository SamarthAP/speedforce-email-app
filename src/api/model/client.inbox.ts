import { IEmailThread, ISelectedEmail } from "../../lib/db";

export interface ClientInboxTabType {
  title: string;
  folderId: string;
  filterThreadsFnc?: (selectedEmail: ISelectedEmail) => Promise<IEmailThread[]>;
  gmailQuery?: string;
  outlookQuery?: string;
  canArchiveThread?: boolean;
  canTrashThread?: boolean;
  canDeletePermanentlyThread?: true;
}
