export enum SharedDraftAccessType {
  VIEW = 0,
  EDIT = 1,
  OWNER = 2,
}

export enum SharedDraftStatusType {
  OPEN = "OPEN",
  SENT = "SENT",
  DISCARDED = "DISCARDED",
}

export interface SharedDraftParticipantType {
  email: string;
  accessLevel: SharedDraftAccessType;
}

export interface SharedDraftDataType {
  id: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  date: number;
  snippet: string;
  html: string;
}

export interface SharedDraftCommentType {
  id: string;
  email: string;
  date: number;
  comment: string;
}
