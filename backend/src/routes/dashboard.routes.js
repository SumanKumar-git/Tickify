import express from "express";
import {getAdminDashboard, getOrganizerDashboard, getParticipantDashboard} from "../controllers/dashboard.controller.js";
import {authMiddleware} from "../middlewares/auth.middleware.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/admin",authMiddleware,getAdminDashboard);


dashboardRouter.get("/organizer",authMiddleware,getOrganizerDashboard);


dashboardRouter.get("/participant",authMiddleware,getParticipantDashboard);

export default dashboardRouter;