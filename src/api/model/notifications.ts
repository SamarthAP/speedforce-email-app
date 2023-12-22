export interface NotificationMessageType {
  messageType: "GMAIL_NOTIFICATION" | "OUTLOOK_NOTIFICATION";
  messageData: {
    email: string;
    provider: string;
    historyId: string;
  };
}

export interface WatchResponseType {
  historyId: string;
  expiration: string;
}

export interface OutlookSubscriptionType {
  id: string;
  resource: string;
  applicationId: string;
  changeType: string;
  clientState: string | null;
  notificationUrl: string;
  lifecycleNotificationUrl: string;
  expirationDateTime: string;
  creatorId: string;
  latestSupportedTlsVersion: string;
  encryptionCertificate: string;
  encryptionCertificateId: string;
  includeResourceData: boolean;
  notificationContentType: string;
}

export interface OutlookCreateSubscriptionRequestType {
  changeType: string;
  notificationUrl: string;
  resource: string;
  expirationDateTime: string;
  clientState: string;
  latestSupportedTlsVersion: string;
}
