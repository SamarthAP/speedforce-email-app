import { init } from "@sentry/electron/main";

init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // For offline errors on main process, queue them up and send them when the user comes back onlinex
  transportOptions: {
    maxQueueAgeDays: 30,
    maxQueueCount: 30,
  },
});
