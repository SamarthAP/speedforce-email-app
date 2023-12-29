import { IMessage } from "../../lib/db";
import {
  decodeGoogleMessageData,
  getMessageHeader,
  formatDateForForwardTemplate,
} from "../../lib/util";
import _ from "lodash";

export function getToRecipients(message: IMessage, email: string): string[] {
  const from =
    getMessageHeader(message.headers, "From").match(/[\w.-]+@[\w.-]+/g) || [];
  const to =
    getMessageHeader(message.headers, "To").match(/[\w.-]+@[\w.-]+/g) || [];
  const cc =
    getMessageHeader(message.headers, "Cc").match(/[\w.-]+@[\w.-]+/g) || [];

  // Recipients can come from any of the from, to, and cc fields
  const toRecipients = _.uniq(
    _.concat(from, to, cc).map((r) => r.toLowerCase())
  );

  return toRecipients.filter((r) => r !== null && r !== email);
}

export function addTabbedMessageToForwardedHTML(
  beforeString: string,
  message: IMessage,
  afterString: string
) {
  const from =
    getMessageHeader(message.headers, "From").match(/[\w.-]+@[\w.-]+/g)?.[0] ||
    "";
  const to =
    getMessageHeader(message.headers, "To").match(/[\w.-]+@[\w.-]+/g)?.[0] ||
    "";
  const subject = getMessageHeader(message.headers, "Subject");
  const date = getMessageHeader(message.headers, "Date");
  // TODO: consider other fields here, including cc, bcc, etc.

  if (!from || !date) {
    return { beforeString, afterString };
  }

  const formattedDate = formatDateForForwardTemplate(new Date(date));
  const htmlData = message.htmlData;

  return {
    beforeString: `${beforeString}
                <blockquote style="border:none;border-left:solid #cccccc 1.0pt;padding:0cm 0cm 0cm 6.0pt;margin-left:4.8pt;margin-right:0cm">
                  <div>
                    <div>From: ${from}</div>
                    <div>Date: ${formattedDate}</div>
                    <div>Subject: ${subject}</div>
                    <div>To: ${to}</div>
                    <br/>
                    ${htmlData}
                    <br/>`,
    afterString: `</div>
                </blockquote>
                <br/><br/>${afterString}`,
  };
}

export async function buildForwardedHTML(
  message: IMessage,
  newMessageHTML = ""
) {
  let beforeString = `${newMessageHTML}<div>---------- Forwarded message ---------</div>`;
  let afterString = "";

  ({ beforeString, afterString } = addTabbedMessageToForwardedHTML(
    beforeString,
    message,
    afterString
  ));

  return `${beforeString}${afterString}`;
}
