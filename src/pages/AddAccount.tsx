import GoogleLogo from "../assets/googleLogo.svg";
import MicrosoftLogo from "../assets/microsoftLogo.svg";

export default function AddAccount() {
  /**
   * Opens a URL in the default browser
   * @param url string representing the URL
   */
  function openOAuthWindow(url: string) {
    window.electron.ipcRenderer.sendMessage("open-link-in-browser", url);
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <div className="flex flex-col">
        <button
          type="button"
          className="inline-flex items-center gap-x-1.5 rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          <GoogleLogo />
          Sign in with Google
        </button>
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-x-1.5 rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          <MicrosoftLogo />
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}
