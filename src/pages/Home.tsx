import supabase from "../lib/supabase";

export default function Home() {
  async function logout() {
    const { error } = await supabase.auth.signOut();
    console.log(error);
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <div>hello</div>
      <button
        onClick={() => logout()}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Logout
      </button>
    </div>
  );
}
