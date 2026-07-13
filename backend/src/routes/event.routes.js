import express from "express";
import upload from "../middlewares/multer.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
    createEvent,
    updateEvent,
    getAllEvents,
    getAllEventsByOrganizer,
    getEventsForAdmin,
    getEventByIdForUser,
    getEventByIdForAdmin,
    getEventByIdForOrganizer,
    deleteEvent,
    approveEvent,
    rejectEvent
} from "../controllers/event.controller.js";

const eventRouter = express.Router();


// Public event route
eventRouter.get("/",getAllEvents);

// Organizer routes

eventRouter.post("/organizer/create",authMiddleware,upload.single("poster"),createEvent);

eventRouter.get("/organizer/events",authMiddleware,getAllEventsByOrganizer);

eventRouter.get("/organizer/events/:id",authMiddleware,getEventByIdForOrganizer);

eventRouter.patch("/organizer/events/:id",authMiddleware,upload.single("poster"),updateEvent);

eventRouter.delete("/organizer/events/:id",authMiddleware,deleteEvent);


// Admin routes

eventRouter.get("/admin/events",authMiddleware,getEventsForAdmin);

eventRouter.get("/admin/events/:id",authMiddleware,getEventByIdForAdmin);

eventRouter.patch("/admin/approve/:id",authMiddleware,approveEvent);

eventRouter.patch("/admin/reject/:id",authMiddleware,rejectEvent);

//Dynamic routes
eventRouter.get("/:id",getEventByIdForUser);


export default eventRouter;