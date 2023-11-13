export interface EventsListResponse {
  kind: string;
  etag: string;
  summary: string;
  description: string;
  updated: string;
  timeZone: string;
  accessRole: string;
  defaultReminders: {
    method: string;
    minutes: number;
  }[];
  nextPageToken: string;
  nextSyncToken: string;
  items: EventResource[];
}

export interface EventResource {
  kind: string;
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string; // Use string or Date based on your requirements for date/time
  updated: string; // Use string or Date based on your requirements for date/time
  summary: string;
  description: string;
  location: string;
  colorId: string;
  creator: {
    id: string;
    email: string;
    displayName: string;
    self: boolean;
  };
  organizer: {
    id: string;
    email: string;
    displayName: string;
    self: boolean;
  };
  start: {
    date: string; // Use string or Date based on your requirements for date/time
    dateTime: string; // Use string or Date based on your requirements for date/time
    timeZone: string;
  };
  end: {
    date: string; // Use string or Date based on your requirements for date/time
    dateTime: string; // Use string or Date based on your requirements for date/time
    timeZone: string;
  };
  endTimeUnspecified: boolean;
  recurrence: string[];
  recurringEventId: string;
  originalStartTime: {
    date: string; // Use string or Date based on your requirements for date/time
    dateTime: string; // Use string or Date based on your requirements for date/time
    timeZone: string;
  };
  transparency: string;
  visibility: string;
  iCalUID: string;
  sequence: number; // Use number for integer
  attendees: {
    id: string;
    email: string;
    displayName: string;
    organizer: boolean;
    self: boolean;
    resource: boolean;
    optional: boolean;
    responseStatus: string;
    comment: string;
    additionalGuests: number;
  }[];
  attendeesOmitted: boolean;
  extendedProperties: {
    private: {
      [key: string]: string;
    };
    shared: {
      [key: string]: string;
    };
  };
  hangoutLink: string;
  conferenceData: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
      status: {
        statusCode: string;
      };
    };
    entryPoints: {
      entryPointType: string;
      uri: string;
      label: string;
      pin: string;
      accessCode: string;
      meetingCode: string;
      passcode: string;
      password: string;
    }[];
    conferenceSolution: {
      key: {
        type: string;
      };
      name: string;
      iconUri: string;
    };
    conferenceId: string;
    signature: string;
    notes: string;
  };
  gadget: {
    type: string;
    title: string;
    link: string;
    iconLink: string;
    width: number; // Use number for integer
    height: number; // Use number for integer
    display: string;
    preferences: {
      [key: string]: string;
    };
  };
  anyoneCanAddSelf: boolean;
  guestsCanInviteOthers: boolean;
  guestsCanModify: boolean;
  guestsCanSeeOtherGuests: boolean;
  privateCopy: boolean;
  locked: boolean;
  reminders: {
    useDefault: boolean;
    overrides: {
      method: string;
      minutes: number; // Use number for integer
    }[];
  };
  source: {
    url: string;
    title: string;
  };
  workingLocationProperties: {
    type: string;
    homeOffice: any; // You should specify the correct type for 'homeOffice'
    customLocation: {
      label: string;
    };
    officeLocation: {
      buildingId: string;
      floorId: string;
      floorSectionId: string;
      deskId: string;
      label: string;
    };
  };
  attachments: {
    fileUrl: string;
    title: string;
    mimeType: string;
    iconLink: string;
    fileId: string;
  }[];
  eventType: string;
}
