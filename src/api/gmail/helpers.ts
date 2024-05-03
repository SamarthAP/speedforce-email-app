import { IMessage } from "../../lib/db";
import { getMessageHeader, formatDateForForwardTemplate } from "../../lib/util";
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
  const cc = getMessageHeader(message.headers, "Cc");
  const subject = getMessageHeader(message.headers, "Subject");
  const date = getMessageHeader(message.headers, "Date") || message.date;

  if (!from || !date) {
    return { beforeString, afterString };
  }

  const formattedDate = formatDateForForwardTemplate(new Date(date));
  const htmlData = message.htmlData;

  return {
    beforeString: `${beforeString}
                <div class="speedforce_quote">
                  <div>---------- Forwarded message ---------</div>
                  <div class="testclass">From: ${from}</div>
                  <div>Date: ${formattedDate}</div>
                  <div>Subject: ${subject}</div>
                  <div>To: ${to}</div>
                  ${cc ? "<div>Cc: " + cc + "</div>" : ""}
                  <br>
                  <blockquote style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">
                    <div dir="ltr">
                      ${htmlData}`,
    afterString: `
                    </div>
                  </blockquote>
                </div>
                <br><br>${afterString}`,
  };
}

export async function buildForwardedHTML(
  message: IMessage,
  newMessageHTML = ""
) {
  let beforeString = `${newMessageHTML}`;
  let afterString = "";

  ({ beforeString, afterString } = addTabbedMessageToForwardedHTML(
    beforeString,
    message,
    afterString
  ));

  return `${beforeString}${afterString}`;
}
