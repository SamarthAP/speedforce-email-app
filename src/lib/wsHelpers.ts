import { dLog } from "./noProd";

export async function handleMessage(event: MessageEvent) {
  const data = JSON.parse(event.data);

  dLog("ws message received", data);
}
