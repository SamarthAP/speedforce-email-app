export interface OutlookMailFolderType {
  id: string;
  displayName: string;
  parentFolderId: string;
  childFolderCount: number;
  unreadItemCount: number;
  totalItemCount: number;
  sizeInBytes: number;
  isHidden: boolean;
}
