import type IForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import webpack from "webpack";
import dotenv from "dotenv";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: "webpack-infrastructure",
  }),
  new webpack.EnvironmentPlugin({
    ...dotenv.config({
      path: path.resolve(__dirname, ".env"),
    }).parsed,
  }),
  new webpack.DefinePlugin({
    'process.type': '"renderer"'
  }),
];
