import type { ForgeConfig } from "@electron-forge/shared-types";
import { PublisherGithub } from "@electron-forge/publisher-github";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";
import GithubYmlPublisher from "./GithubYmlPublisher";

const config: ForgeConfig = {
  // buildIdentifier: process.env.IS_BETA ? "beta" : "prod",
  packagerConfig: {
    icon: "./static/icons/icon.icns",
    protocols: [
      {
        name: "speedforce",
        schemes: ["speedforce"],
      },
    ],
    appBundleId: "me.speedforce.app",
    asar: true,
    extraResource: ["static/app-update.yml"],
    appCategoryType: "public.app-category.productivity",
    osxSign: {
      // identity: process.env.OSX_IDENTITY || "", // Name of certificate to use when signing. Default to be selected with respect to provisioning-profile and platform from keychain or keychain by system default.
      // "gatekeeper-assess": false,
      // // entitlements: "build/entitlements.mac.plist",
      // // "entitlements-inherit": "build/entitlements.mac.plist",
      // // "signature-flags": "library",
      // optionsForFile: (filePath) => {
      //   return {
      //     hardenedRuntime: true,
      //     entitlements: "./macbuild/entitlements.mac.plist",
      //   };
      // },
    }, // object must exist even if empty
    osxNotarize: {
      tool: "notarytool",
      appleId: process.env.APPLE_ID || "",
      appleIdPassword: process.env.APPLE_ID_PASSWORD || "",
      teamId: process.env.TEAM_ID || "",
    },
  },
  publishers: [
    new PublisherGithub({
      repository: {
        owner: process.env.GH_OWNER || "",
        name: process.env.GH_REPO || "",
      },
      prerelease: false,
      draft: false,
      authToken: process.env.GH_TOKEN || "",
    }),
    new GithubYmlPublisher({}),
  ],
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ["darwin"]),
    new MakerDMG({ format: "ULFO", icon: "./static/icons/icon.icns" }, [
      "darwin",
    ]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy: "script-src 'self' 'unsafe-eval';",
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/index.html",
            js: "./src/renderer.ts",
            name: "main_window",
            preload: {
              js: "./src/preload.ts",
            },
          },
        ],
      },
    }),
  ],
};

export default config;
