import express from "express";
import { initiatePayment, verifyPayment, getMyPayments } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const paymentRouter = express.Router();

paymentRouter.get("/my-payments", authMiddleware, getMyPayments);
paymentRouter.post("/booking/:bookingId/initiate", authMiddleware, initiatePayment);
paymentRouter.post("/verify", authMiddleware, verifyPayment);

export default paymentRouter;