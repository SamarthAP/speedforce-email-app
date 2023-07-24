export function toggleQuote(quote: HTMLDivElement) {
  if (quote.style.display === "none") {
    quote.style.display = "block";
  } else {
    quote.style.display = "none";
  }
}

export function insertQuoteToggle(quote: HTMLDivElement) {
  const toggleButton = document.createElement("button");
  toggleButton.style.borderRadius = "8px";
  toggleButton.style.border = "1px solid #bbb";
  toggleButton.style.backgroundColor = "#eee";
  toggleButton.style.cursor = "pointer";
  toggleButton.innerText = "...";
  toggleButton.onclick = () => {
    toggleQuote(quote);
  };

  const wrapper = document.createElement("div");
  wrapper.style.width = "100%";
  wrapper.style.paddingTop = "8px";
  wrapper.style.paddingBottom = "8px";
  wrapper.appendChild(toggleButton);
  quote.insertAdjacentElement("beforebegin", wrapper);
}

export function addQuoteToggleButton(emailContainer: Document) {
  // add toggle button before quote
  const gmailQuote = emailContainer.querySelector(
    ".gmail_quote"
  ) as HTMLDivElement;

  const protonmailQuote = emailContainer.querySelector(
    ".protonmail_quote"
  ) as HTMLDivElement;

  // Currently this will add a button to every quote in the email, but it should only add it to the first one (the one at the top of the dom tree).
  // Right now, even nested quotes have a button

  if (gmailQuote) {
    insertQuoteToggle(gmailQuote);
    toggleQuote(gmailQuote);
  }

  if (protonmailQuote) {
    insertQuoteToggle(protonmailQuote);
    toggleQuote(protonmailQuote);
  }
}
