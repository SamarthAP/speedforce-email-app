import supabase from "../lib/supabase";
export const getJWTHeaders = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return {};
  }

  const jwt = data?.session.access_token;

  return {
    Authorization: `Bearer ${jwt}`,
  };
};
