import cron from "node-cron";
import { releaseExpiredReservation } from "../services/bookingCleanup.service.js";
import { reconcileExpiredPayments } from "../services/paymentReconciliation.service.js";

export const startBookingCleanupJob = () => {
    cron.schedule("* * * * *", async () => {
        try{
            await releaseExpiredReservation();
        }
        catch(error){
            console.log("Booking cleanup job failed:", error);
        }
    });

    cron.schedule("* * * * *", async () => {

        try {

            await reconcileExpiredPayments();

        } catch (error) {

            console.error(
                "Payment reconciliation failed:",
                error
            );
        }

    });
};
