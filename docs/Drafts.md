# Drafts

Documenting logical flow of all behaviour regarding drafts

## Gmail

Gmail has 3 distinct entities: messages, threads and drafts

- A draft is tied to a message, and has the schema

```json
{
  "id": "string",
  "message?": {
    "id": "string",
    "threadId": "string"
  }
}
```

- Message id and thread id are subject to change when updating a draft

### Syncing Threads

Steps for performing a regular threads sync on gmail:

- Fetch from [users.threads.list](https://developers.google.com/gmail/api/reference/rest/v1/users.threads/list)
- For each thread, get thread details (including messages) from [users.threads.get](https://developers.google.com/gmail/api/reference/rest/v1/users.threads/get)
  - If message labels includes `DRAFTS`, need to find the associated draft id. Gmail does not provide out of box any way to get the draft id given the message id. First, check dexie `Drafts` table by querying on thread id. If it does not exist, fetch drafts list from [users.drafts.list](https://developers.google.com/gmail/api/reference/rest/v1/users.drafts/list) and then find corresponding draft. Add to dexie.

### Syncing drafts

- Fetch from [users.drafts.list](https://developers.google.com/gmail/api/reference/rest/v1/users.drafts/list)
- For each draft, get details (including singular message) from [users.drafts.get](https://developers.google.com/gmail/api/reference/rest/v1/users.drafts/get)
  - Process message and thread the same as we would for a normal sync
  - Upsert draft to drafts table by id

```
Message {
  id: message.id | draft.message.id
  threadId: draft.message.threadId
  draftId: draft.id
}
```

### Get drafts page thread list (Dexie)

- Get drafts list by email from `Drafts` table
- Each draft should have one corresponding threadId, so pass this in to threads list

### Clicking a draft

- If draft is standalone (not a reply/fwd) then open EditDraft view
- If draft is part of an existing email chain, then open regular threadPage view. Messages which are drafts should default be open (ignoring the isLast prop) and editable
  - We can determine if a draft is part of an existing chain based on if there are muliple messages under this threadId
