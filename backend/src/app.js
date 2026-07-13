import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import userRouter from "./routes/user.routes.js";
import eventRouter from "./routes/event.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import ticketRouter from "./routes/ticket.routes.js";
import paymentRouter from "./routes/payment.route.js";
import refundRouter from "./routes/refund.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(helmet());
app.use(hpp());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200
});
app.use(limiter);

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

app.use("/api/auth", userRouter);
app.use("/api/events", eventRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/refunds", refundRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/dashboard", dashboardRouter);

export default app;