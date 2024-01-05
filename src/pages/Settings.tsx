import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Titlebar from "../components/Titlebar";
import { ISelectedEmail } from "../lib/db";
import { getAccessToken } from "../api/accessToken";
import { GmailAutoForwardingDataType } from "../api/model/settings.basic";
import { getAutoForwarding } from "../api/gmail/settings/basic";
import { dLog } from "../lib/noProd";

interface SettingsProps {
  selectedEmail: ISelectedEmail;
}

export default function Settings({ selectedEmail }: SettingsProps) {
  const [loading, setLoading] = useState<boolean>(false);
  // const [enableAutoForwarding, setEnableAutoForwarding] =
  //   useState<boolean>(false);
  // const [newAutoForwardingAddress, setNewAutoForwardingAddress] =
  //   useState<string>("");
  // const [selectedDisposition, setSelectedDisposition] = useState<string>(
  //   "dispositionUnspecified"
  // );
  const [currentAutoforwardingSettings, setCurrentAutoforwardingSettings] =
    useState<GmailAutoForwardingDataType | null>(null);

  // async function submitNewAutoForwardingSettings() {
  //   setLoading(true);

  //   try {
  //     const accessToken = await getAccessToken(selectedEmail.email);
  //     const { data, error } = await updateAutoForwarding(
  //       accessToken,
  //       enableAutoForwarding,
  //       newAutoForwardingAddress,
  //       selectedDisposition
  //     );

  //     if (error || !data) {
  //       throw new Error("Error updating autoforwarding settings");
  //     }

  //     setCurrentAutoforwardingSettings(data);
  //   } catch (e) {
  //     dLog("submitNewAutoForwardingSettings - Error", e);
  //   }

  //   setLoading(false);
  // }

  useEffect(() => {
    async function getAutoForwardingSettings() {
      setLoading(true);

      try {
        const accessToken = await getAccessToken(selectedEmail.email);
        const { data, error } = await getAutoForwarding(accessToken);

        if (error || !data) {
          throw new Error("Error getting autoforwarding settings");
        }

        setCurrentAutoforwardingSettings(data);
      } catch (e) {
        dLog("submitNewAutoForwardingSettings - Error", e);
      }

      setLoading(false);
    }

    if (
      selectedEmail &&
      selectedEmail.email &&
      selectedEmail.provider === "google"
    ) {
      void getAutoForwardingSettings();
    }
  }, [selectedEmail, selectedEmail.email]);

  return (
    <div className="h-screen w-screen flex flex-col dark:bg-zinc-900">
      <Titlebar />
      <div className="h-full flex">
        <Sidebar />
        <div className="p-4 w-full">
          <p className="font-medium text-lg tracking-wide dark:text-white">
            Settings
          </p>
          <div className="mt-2 py-2 border-t border-black dark:border-white">
            <p className="text-base dark:text-white">Autoforwarding</p>

            <p className="text-sm dark:text-white">
              Enabled:{" "}
              {currentAutoforwardingSettings
                ? currentAutoforwardingSettings.enabled
                  ? "Yes"
                  : "No"
                : ""}
            </p>

            <p className="text-sm dark:text-white">
              Email Address:{" "}
              {currentAutoforwardingSettings
                ? currentAutoforwardingSettings.emailAddress
                : ""}
            </p>

            <p className="text-sm dark:text-white">
              Disposition:{" "}
              {currentAutoforwardingSettings
                ? currentAutoforwardingSettings.disposition
                : ""}
            </p>

            {/* <p className="mt-2 text-base dark:text-white">
              Update autoforwarding:
            </p>

            <div className="flex">
              <input
                type="checkbox"
                checked={enableAutoForwarding}
                onChange={(e) => {
                  setEnableAutoForwarding(e.target.checked);
                }}
              />
              <p className="ml-2 dark:text-white text-sm">
                Enable autoforwarding
              </p>
            </div>

            {enableAutoForwarding && (
              <div>
                <input
                  type="email"
                  disabled={loading}
                  required
                  placeholder="Enter email address"
                  className="border border-slate-200 dark:border-zinc-700 rounded-md p-1.5 mt-2 mr-2 outline-none bg-transparent dark:text-white text-sm"
                  onChange={(e) => {
                    setNewAutoForwardingAddress(e.target.value);
                  }}
                />
                <select
                  id="disposition"
                  name="disposition"
                  disabled={loading}
                  className="mt-2 p-1.5 block rounded-md border border-slate-200 dark:border-zinc-700 text-sm outline-none bg-transparent dark:text-white"
                  defaultValue={"dispositionUnspecified"}
                  onChange={(e) => {
                    setSelectedDisposition(e.target.value);
                  }}
                >
                  <option value="dispositionUnspecified">
                    Disposition Unspecified
                  </option>
                  <option value="leaveInInbox">Leave in Inbox</option>
                  <option value="archive">Archive</option>
                  <option value="trash">Trash</option>
                  <option value="markRead">Mark as Read</option>
                </select>
              </div>
            )}

            <SimpleButton
              loading={loading}
              disabled={loading}
              onClick={() => {
                void submitNewAutoForwardingSettings();
              }}
              text="Submit"
            /> */}
          </div>
        </div>
      </div>
    </div>
  );
}
