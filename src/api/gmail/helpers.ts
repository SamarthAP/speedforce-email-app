import { IMessage } from "../../lib/db";
import { getMessageHeader } from "../../lib/util";
import _ from "lodash";

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
