export interface GmailForwardingAddressDataType {
  forwardingEmail: string;
  verificationStatus: "accepted" | "pending" | "verificationStatusUnspecified";
}

export interface GmailListForwardingAddressesDataType {
  forwardingAddresses: GmailForwardingAddressDataType[];
}
