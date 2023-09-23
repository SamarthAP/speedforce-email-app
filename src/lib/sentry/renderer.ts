import { init } from "@sentry/electron/renderer";

if (process.env.NODE_ENV === "production") {
  init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
}
