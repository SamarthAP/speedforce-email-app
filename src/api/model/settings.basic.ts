export interface GmailAutoForwardingDataType {
  disposition:
    | "dispositionUnspecified"
    | "leaveInInbox"
    | "archive"
    | "trash"
    | "markRead";
  emailAddress: string;
  enabled: boolean;
}
