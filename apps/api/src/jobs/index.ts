import { startReservationCleanupJob } from "./cleanReservations";

export const startJobs = () => {
  startReservationCleanupJob();
};
