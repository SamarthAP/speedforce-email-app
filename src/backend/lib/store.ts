import ElectronStore from "electron-store";

interface ClientType {
  id: string;
  lastSyncTime: number;
}

interface StoreType {
  client: ClientType;
}

const store = new ElectronStore<StoreType>();

export default store;
