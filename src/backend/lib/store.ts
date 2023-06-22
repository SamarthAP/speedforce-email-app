import ElectronStore from "electron-store";

interface ClientType {
  id: string;
}

interface StoreType {
  client: ClientType;
}

const store = new ElectronStore<StoreType>();

export default store;
