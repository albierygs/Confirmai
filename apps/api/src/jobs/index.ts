import { startReservationCleanupJob } from "./cleanReservations";
import { startSubscriptionExpirationJob } from "./expireSubscriptions";

export const startJobs = () => {
  startReservationCleanupJob();
  startSubscriptionExpirationJob();
};
