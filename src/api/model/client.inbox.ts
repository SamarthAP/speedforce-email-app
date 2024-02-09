import { IEmailThread, IMessage, ISelectedEmail } from "../../lib/db";

export interface ClientTabNavigationType {
  title: string;
  href: string;
}

export interface ClientInboxTabType {
  title: string;
  // folderId: string;
  filterThreadsFnc?: (selectedEmail: ISelectedEmail) => Promise<IEmailThread[]>;
  filterThreadsSearchFnc?: (
    selectedEmail: ISelectedEmail,
    searchItems: string[],
    messages: IMessage[]
  ) => Promise<IEmailThread[]>;
  // gmailQuery?: string;
  // outlookQuery?: string;
  canArchiveThread?: boolean;
  canTrashThread?: boolean;
  isSearchMode?: boolean;
  isDraftMode?: boolean;
  canDeletePermanentlyThread?: true;
}
