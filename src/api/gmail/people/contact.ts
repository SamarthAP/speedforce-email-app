import { GMAIL_PEOPLE_API_URL } from "../constants";
import {
  GmailContactListDataType,
  GmailListDiscoveryPeopleDataType,
  GmailListOtherContactsDataType,
} from "../../model/people.contacts";

export const list = async (accessToken: string) => {
  let data: GmailContactListDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `${GMAIL_PEOPLE_API_URL}/connections?personFields=names,emailAddresses`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching contacts";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error fetching contacts";
  }

  return { data, error };
};

// make request to GET https://people.googleapis.com/v1/people:listDirectoryPeople
export const listDirectoryPeople = async (accessToken: string) => {
  let data: GmailListDiscoveryPeopleDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `https://people.googleapis.com/v1/people:listDirectoryPeople?readMask=names,emailAddresses&sources=DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching contacts";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error fetching contacts";
  }

  return { data, error };
};

// make request to GET https://people.googleapis.com/v1/otherContacts
export const listOtherContacts = async (accessToken: string) => {
  let data: GmailListOtherContactsDataType | null = null;
  let error: string | null = null;

  try {
    const res: Response = await fetch(
      `https://people.googleapis.com/v1/otherContacts?readMask=names,emailAddresses`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      error = "Error fetching contacts";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error fetching contacts";
  }

  return { data, error };
};

export const getProfilePicture = async (accessToken: string) => {
  let data: any;
  let error: string | null = null;
  try {
    const res: Response = await fetch(
      `https://people.googleapis.com/v1/people/me?personFields=photos`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) {
      error = "Error fetching contacts";
    } else {
      data = await res.json();
    }
  } catch (e) {
    error = "Error getting profile picture";
  }

  return { data, error };
};
