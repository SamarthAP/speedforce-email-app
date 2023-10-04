import type IForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import webpack from "webpack";
import dotenv from "dotenv";
import path from "path";
// const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: "webpack-infrastructure",
  }),
  // this is only used in webpack.renderer.config.ts
  new webpack.EnvironmentPlugin({
    ...dotenv.config({
      path: path.resolve(__dirname, ".env.renderer"),
    }).parsed,
  }),
  new webpack.DefinePlugin({
    "process.type": '"renderer"',
  }),
  // NOTE: Will run every time you save a file in the renderer process,
  // and it will upload the source maps to Sentry, causing a delay in rerendering.
  // sentryWebpackPlugin({
  //   org: "speedforce",
  //   project: "speedforce-app",
  //   authToken: process.env.SENTRY_AUTH_TOKEN,
  // }),
];
