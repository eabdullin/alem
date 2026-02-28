import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import path from "path";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    appBundleId: "com.qurt.desktop",
    icon: path.join(__dirname, "public/icon"),
    ...(process.platform === "darwin"
      ? {
          osxSign: {
            optionsForFile: () => ({
              entitlements: path.join(__dirname, "build/entitlements.mac.plist"),
              entitlementsInherit: path.join(__dirname, "build/entitlements.mac.inherit.plist"),
            }),
          },
          osxNotarize:
            process.env.API_KEY_ID && process.env.API_KEY_ISSUER_ID
              ? {
                  appleApiKey: process.env.APPLE_API_KEY_PATH ?? path.join(process.env.HOME ?? "", "private_keys", `AuthKey_${process.env.API_KEY_ID}.p8`),
                  appleApiKeyId: process.env.API_KEY_ID,
                  appleApiIssuer: process.env.API_KEY_ISSUER_ID,
                }
              : process.env.APPLE_ID
                ? {
                    appleId: process.env.APPLE_ID,
                    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD ?? process.env.APPLE_ID_PASSWORD,
                    teamId: process.env.APPLE_TEAM_ID,
                  }
                : undefined,
        }
      : {}),
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: "qurt",
      authors: "Yelaman Abdullin",
      description: "AI Coworker and assistant with provider freedom: bring your own API keys, choose your model, and chat with files/images in one place.",
      setupIcon: path.join(__dirname, "public/icon.ico"),
      // certificateFile/certificatePassword for code signing when you have a cert
    }),
    new MakerZIP({}, ["darwin"]),
    new MakerDMG({
      name: "qurt",
      icon: path.join(__dirname, "public/icon.icns"),
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main/index.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload/index.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
