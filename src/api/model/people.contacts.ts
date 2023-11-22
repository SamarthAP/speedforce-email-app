export interface GmailContactListDataType {
  connections: GooglePersonDataType[] | undefined;
  nextPageToken: string | undefined;
  nextSyncToken: string | undefined;
  totalPeople: number | undefined;
  totalItems: number | undefined;
}

export interface GmailListDiscoveryPeopleDataType {
  people: GooglePersonDataType[] | undefined;
  nextPageToken: string | undefined;
  nextSyncToken: string | undefined;
}

export interface GooglePersonDataType {
  resourceName: string;
  etag: string;
  names: {
    metadata: {
      primary: boolean;
      source: {
        type: string;
        id: string;
      };
    };
    displayName: string;
    familyName: string; // last name
    givenName: string; // first name
    displayNameLastFirst: string;
    unstructuredName: string;
  }[];
  emailAddresses: {
    metadata: {
      verified: boolean;
      sourcePrimary: boolean;
      primary: boolean;
      source: {
        type: string;
        id: string;
      };
    };
    value: string; // the email
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
