import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 3:00 AM UTC to expire subscriptions
// This catches any subscriptions that weren't updated via webhooks
crons.daily(
  "expire-subscriptions",
  { hourUTC: 3, minuteUTC: 0 },
  internal.subscriptions.expireSubscriptions
);

export default crons;
