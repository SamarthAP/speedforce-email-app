import toast from "react-hot-toast";
import supabase from "./supabase";
import { clearAllEmailsFromDb } from "./dexie/helpers";

const fullSignout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    toast("Error signing out");
  }

  await clearAllEmailsFromDb();
  toast("Successfully signed out");
};

export { fullSignout };
