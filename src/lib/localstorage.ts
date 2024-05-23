import { refreshAccessToken } from "../api/auth";
import { lg } from "./noProd";

export interface SelectedAccount {
  email: string;
  provider: "google" | "outlook";
  accessToken: string;
  expiresAt: number;
}

export type Accounts = SelectedAccount[];

export function getSelectedAccount() {
  try {
    const selectedAccount = localStorage.getItem("selectedAccount");

    if (!selectedAccount) {
      return null;
    }

    const parsedSelectedAccount: SelectedAccount = JSON.parse(
      selectedAccount || "{}"
    );

    if (!parsedSelectedAccount.email || !parsedSelectedAccount.provider) {
      return null;
    }

    return {
      email: parsedSelectedAccount.email,
      provider: parsedSelectedAccount.provider,
      accessToken: parsedSelectedAccount.accessToken || "",
      expiresAt: parsedSelectedAccount.expiresAt || 0,
    } as SelectedAccount;
  } catch (e) {
    return null;
  }
}

export function getAccounts() {
  try {
    const accounts = localStorage.getItem("accounts");
    if (!accounts) {
      return [];
    }

    const parsedAccounts: Accounts = JSON.parse(accounts || "[]");

    if (!Array.isArray(parsedAccounts)) {
      return [];
    }

    return parsedAccounts;
  } catch (e) {
    return [];
  }
}

export async function refreshAllAccessTokens() {
  const accounts = getAccounts();
  const selectedAccount = getSelectedAccount();

  const newAccounts: Accounts = [];

  for (const account of accounts) {
    // if expires in 2 minutes
    if (account.expiresAt < Date.now() - 1000 * 60 * 2) {
      // refresh token
      const { data, error } = await refreshAccessToken(
        account.email,
        account.provider
      );

      // update account with new token

      if (error || !data) {
        lg("Error refreshing access token for " + account.email);
        newAccounts.push(account);
      } else {
        newAccounts.push({
          email: account.email,
          provider: account.provider,
          accessToken: data.accessToken,
          expiresAt: data.expiresAt,
        });

        if (selectedAccount?.email === account.email) {
          localStorage.setItem(
            "selectedAccount",
            JSON.stringify({
              email: account.email,
              provider: account.provider,
              accessToken: data.accessToken,
              expiresAt: data.expiresAt,
            })
          );
        }
      }
    }
  }

  localStorage.setItem("accounts", JSON.stringify(newAccounts));
}

/**
 *
 * @param email Email of account to refresh
 * @returns Current access token or new access token if it was refreshed
 */
export async function refreshAccessTokenForEmail(email: string) {
  const accounts = getAccounts();
  const newAccounts: Accounts = [];
  let refreshed = false;
  let newAccessToken = "";

  for (const account of accounts) {
    if (account.email === email) {
      // refresh token
      if (account.expiresAt < Date.now() - 1000 * 60 * 2) {
        const { data, error } = await refreshAccessToken(
          account.email,
          account.provider
        );

        // update account with new token

        if (error || !data) {
          lg("Error refreshing access token for " + account.email);
          newAccounts.push(account);
        } else {
          newAccounts.push({
            email: account.email,
            provider: account.provider,
            accessToken: data.accessToken,
            expiresAt: data.expiresAt,
          });

          localStorage.setItem(
            "selectedAccount",
            JSON.stringify({
              email: account.email,
              provider: account.provider,
              accessToken: data.accessToken,
              expiresAt: data.expiresAt,
            })
          );

          refreshed = true;
          newAccessToken = data.accessToken;
        }
      } else {
        newAccounts.push(account);
        newAccessToken = account.accessToken;
      }
    } else {
      newAccounts.push(account);
    }
  }

  if (refreshed) {
    localStorage.setItem("accounts", JSON.stringify(newAccounts));
  }

  return newAccessToken;
}
