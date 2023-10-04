import type { Configuration } from "webpack";
import { rules } from "./webpack.rules";
import webpack from "webpack";
import dotenv from "dotenv";
import path from "path";

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/index.ts",
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.type": '"browser"',
    }),
    new webpack.EnvironmentPlugin({
      ...dotenv.config({
        path: path.resolve(__dirname, ".env.main"),
      }).parsed,
    }),
  ],
};
