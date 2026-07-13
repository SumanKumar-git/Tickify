import express from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
    createBooking,
    getMyBooking,
    getBookingById,
    cancelBooking,
    getEventRegistrations
} from "../controllers/booking.controller.js";


const bookingRouter = express.Router();

bookingRouter.post("/",authMiddleware,createBooking);

bookingRouter.get("/my-bookings",authMiddleware,getMyBooking);

bookingRouter.get("/event/:eventId/registrations",authMiddleware,getEventRegistrations);

bookingRouter.patch("/:bookingId/cancel",authMiddleware,cancelBooking);

bookingRouter.get("/:bookingId",authMiddleware,getBookingById);



export default bookingRouter;