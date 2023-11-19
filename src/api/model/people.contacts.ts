export interface GmailContactListDataType {
  connections: {
    resourceName: string;
    names: {
      displayName: string;
      familyName: string;
      givenName: string;
    }[];
    emailAddresses: {
      value: string;
    }[];
  }[];
}

export interface OutlookContactListDataType {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  emailAddresses: {
    name: string;
    address: string;
  }[];
}
