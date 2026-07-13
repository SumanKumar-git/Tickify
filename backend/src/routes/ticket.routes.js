import express from "express";
import {authMiddleware} from "../middlewares/auth.middleware.js";
import {checkInTicket, getEventTickets, getMyTickets, getTicketById, getTicketQrPayload} from "../controllers/ticket.controller.js";

const ticketRouter = express.Router();

ticketRouter.get("/my-tickets",authMiddleware,getMyTickets);
ticketRouter.get("/events/:eventId/tickets",authMiddleware,getEventTickets);
ticketRouter.post("/events/:eventId/check-in",authMiddleware,checkInTicket);
ticketRouter.get("/:ticketId/qr",authMiddleware,getTicketQrPayload);
ticketRouter.get("/:ticketId",authMiddleware,getTicketById);


export default ticketRouter;