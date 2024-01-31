export interface OutlookAttachmentDataType {
  id: string;
  lastModifiedDateTime: string;
  name: string;
  contentType: string; // MIME type
  size: number;
  isInline: boolean;
  contentId: string;
  contentBytes: string;
}

export interface NewAttachment {
  mimeType: string;
  filename: string;
  data: string;
  size: number;
}
