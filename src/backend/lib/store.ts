import ElectronStore from "electron-store";

interface ClientType {
  id: string;
  lastWatchTime: string; // Unix timestamp
  lastSyncContactsTime: string; // Unix timestamp
}

interface StoreType {
  client: ClientType;
}

const store = new ElectronStore<StoreType>();

export default store;
