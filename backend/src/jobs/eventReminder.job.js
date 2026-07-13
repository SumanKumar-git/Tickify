import cron from "node-cron";
import {sendUpcomingEventReminders} from "../services/eventReminder.service.js";

export const startEventReminderJob = () => {
    cron.schedule(
        "*/30 * * * *",
        async () => {
            try {
                console.log(
                    "Running event reminder job..."
                );
                await sendUpcomingEventReminders();
                console.log(
                    "Event reminder job completed"
                );
            } catch (error) {
                console.error(
                    "Event reminder job failed:",
                    error.message
                );
            }
        }
    );
};