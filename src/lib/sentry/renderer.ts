import { init } from "@sentry/electron/renderer";

init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
});