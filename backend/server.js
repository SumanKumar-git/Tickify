import "./dns-init.js";
import app from "./src/app.js";
import connectDB from "./src/configs/db.js";
import { startBookingCleanupJob } from "./src/jobs/bookingCleanup.job.js";
import { startEventReminderJob } from "./src/jobs/eventReminder.job.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try{
        await connectDB();
        startBookingCleanupJob();
        startEventReminderJob();

        app.listen(PORT, () => {
            console.log(`Server is running at http://localhost:${PORT}`);
        })
    }
    catch(error){
        console.error("Server connection error:", error);
        process.exit(1);
    }
}

startServer();