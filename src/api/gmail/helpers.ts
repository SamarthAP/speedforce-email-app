import { IMessage } from "../../lib/db";
import { getMessageHeader } from "../../lib/util";
import _ from "lodash";

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getToRecipients(message: IMessage, email: string): string[] {
  const from =
    getMessageHeader(message.headers, "From").match(/[\w\.-]+@[\w\.-]+/g) || [];
  const to =
    getMessageHeader(message.headers, "To").match(/[\w\.-]+@[\w\.-]+/g) || [];
  const cc =
    getMessageHeader(message.headers, "Cc").match(/[\w\.-]+@[\w\.-]+/g) || [];

  // Recipients can come from any of the from, to, and cc fields
  const toRecipients = _.uniq(
    _.concat(from, to, cc).map((r) => r.toLowerCase())
  );

  return toRecipients.filter((r) => r !== null && r !== email);
}

export function getRFC2822DateString(date: Date) {
  
  const dayOfWeek = DAYS_OF_WEEK[date.getUTCDay()];
  const dayOfMonth = date.getUTCDate().toString().padStart(2, '0');
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  const timezoneOffset = date.getTimezoneOffset();
  const timezoneOffsetHours = Math.abs(Math.floor(timezoneOffset / 60)).toString().padStart(2, '0');
  const timezoneOffsetMinutes = (Math.abs(timezoneOffset) % 60).toString().padStart(2, '0');
  const timezone = `${timezoneOffset >= 0 ? '-' : '+'}${timezoneOffsetHours}${timezoneOffsetMinutes}`;
  
  return `${dayOfWeek}, ${dayOfMonth} ${month} ${year} ${hours}:${minutes}:${seconds} ${timezone}`;
}