import mongoose from "mongoose";
import ticketModel from "../models/ticket.model.js";
import eventModel from "../models/event.model.js";
import { createTicketQrPayload, verifyTicketQrPayload } from "../services/ticketQr.service.js";

// Controller to get all tickets of the logged-in user
export const getMyTickets = async (req, res) => {

    try {
        const userId = req.user._id;

        const tickets = await ticketModel
            .find({
                user: userId
            })
            .populate({
                path: "event",
                select: `title poster category startDate endDate venue ticketPrice status`
            })
            .populate({
                path: "booking",
                select: `quantity totalAmount bookingStatus paymentStatus confirmedAt`
            })
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            message: "Tickets fetched successfully",
            count: tickets.length,
            tickets
        });

    } catch (error) {
        console.error(
            "Get my tickets error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch tickets",
            error: error.message
        });
    }
};

// Controller to get a single ticket of the logged-in user
export const getTicketById = async (req, res) => {

    try {

        const { ticketId } = req.params;
        const userId = req.user._id;

        if (
            !mongoose.Types.ObjectId.isValid(
                ticketId
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID"
            });
        }


        const ticket = await ticketModel
            .findOne({
                _id: ticketId,
                user: userId
            })
            .populate({
                path: "event",
                select: `title description poster category startDate endDate venue ticketPrice status organizer`,

                populate: {
                    path: "organizer",
                    select: "fullName email"
                }
            })
            .populate({
                path: "booking",
                select: `quantity totalAmount bookingStatus paymentStatus confirmedAt createdAt`
            });

        if (!ticket) {

            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Ticket fetched successfully",
            ticket
        });

    } catch (error) {
        console.error(
            "Get ticket by ID error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch ticket",
            error: error.message
        });
    }
};

export const getTicketQrPayload = async (req,res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user._id;
        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID"
            });
        }
        const ticket =
            await ticketModel.findOne({
                _id: ticketId,
                user: userId
            });
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        if (ticket.ticketStatus ==="cancelled") {
            return res.status(409).json({
                success: false,
                message:"Cancelled ticket cannot generate QR code"
            });
        }
        if (
            ticket.ticketStatus === "used"
        ) {

            return res.status(409).json({
                success: false,
                message:"Ticket has already been used",
                checkedInAt: ticket.checkedInAt
            });
        }
        const qrPayload =
            createTicketQrPayload({
                ticketNumber: ticket.ticketNumber,
                eventId: ticket.event
            });

        return res.status(200).json({
            success: true,
            message: "Ticket QR payload generated successfully",
            qrPayload,
            ticket: {
                id: ticket._id,
                ticketNumber: ticket.ticketNumber,
                ticketSequence: ticket.ticketSequence,
                ticketStatus: ticket.ticketStatus
            }
        });

    } catch (error) {
        console.error(
            "Get ticket QR payload error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to generate ticket QR payload",
            error: error.message
        });
    }
};

export const checkInTicket = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { qrPayload } = req.body;
        const organizerId = req.user._id;

        if (req.user.role !== "organizer") {
            return res.status(403).json({
                success: false,
                message: "Only organizers can check in tickets"
            });
        }

        if (!qrPayload) {
            return res.status(400).json({
                success: false,
                message: "QR payload is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID"
            });
        }
        const verification = verifyTicketQrPayload(qrPayload);

        if (!verification.valid) {
            return res.status(400).json({
                success: false,
                message: verification.reason
            });
        }

        const {ticketNumber,eventId: qrEventId} = verification;

        if (eventId.toString() !== qrEventId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Ticket does not belong to this event"
            });
        }
        const event = await eventModel.findOne({
            _id: eventId,
            organizer: organizerId
        });

        if (!event) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to check in tickets for this event"
            });
        }

        const now = new Date();
        const allowedStart = new Date(new Date(event.startDate).getTime() - 60 * 60 * 1000);
        const allowedEnd = new Date(event.endDate);

        if (now < allowedStart) {
            return res.status(400).json({
                success: false,
                message: "Check-in not allowed. Check-in opens 1 hour prior to the event."
            });
        }

        if (now > allowedEnd) {
            return res.status(400).json({
                success: false,
                message: "Check-in not allowed. The event has already ended."
            });
        }

        const checkedInTicket =
            await ticketModel.findOneAndUpdate(
                {
                    ticketNumber,
                    event: eventId,
                    ticketStatus: "active",
                    checkedInAt: null
                },
                {
                    $set: {
                        ticketStatus: "used",
                        checkedInAt: new Date()
                    }
                },
                {
                    new: true
                }
            )
            .populate(
                "user",
                "fullName email"
            )
            .populate(
                "booking",
                "quantity totalAmount"
            );

        if (checkedInTicket) {
            return res.status(200).json({
                success: true,
                message:
                    "Ticket checked in successfully",
                ticket: checkedInTicket
            });
        }

        const existingTicket =
            await ticketModel.findOne({
                    ticketNumber,
                    event: eventId
                })
                .populate("user","fullName email");

        if (!existingTicket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found for this event"
            });
        }

        if (existingTicket.ticketStatus === "used") {
            return res.status(409).json({
                success: false,
                message:"Ticket has already been used",
                checkedInAt: existingTicket.checkedInAt,
                ticket: {
                    ticketNumber: existingTicket.ticketNumber,
                    ticketStatus: existingTicket.ticketStatus,
                    user: existingTicket.user
                }
            });
        }

        if (
            existingTicket.ticketStatus ===
            "cancelled"
        ) {
            return res.status(409).json({
                success: false,
                message: "Ticket has been cancelled"
            });
        }

        return res.status(409).json({
            success: false,
            message: "Ticket cannot be checked in"
        });


    } catch (error) {
        console.error("Ticket check-in error:",error );

        return res.status(500).json({
            success: false,
            message: "Failed to check in ticket",
            error: error.message
        });
    }
};

// Controller to get all tickets of an organizer's event

export const getEventTickets = async (req, res) => {
    try {
        const { eventId } = req.params;

        const organizerId = req.user._id;

        const {
            status,
            page = 1,
            limit = 20
        } = req.query;

        if (
            !mongoose.Types.ObjectId.isValid(
                eventId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID"
            });
        }

        if (
            req.user.role !== "organizer"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only organizers can access event tickets"
            });
        }

        const event =
            await eventModel
                .findOne({
                    _id: eventId,
                    organizer: organizerId
                })
                .select(
                    "title startDate endDate status"
                )
                .lean();


        if (!event) {
            return res.status(404).json({
                success: false,
                message:
                    "Event not found or you are not authorized to access its tickets"
            });
        }

        const allowedStatuses = [
            "active",
            "used",
            "cancelled"
        ];


        if (
            status &&
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid ticket status filter"
            });
        }
        const pageNumber =
            Math.max(
                Number.parseInt(page, 10) || 1,
                1
            );


        const limitNumber =
            Math.min(
                Math.max(
                    Number.parseInt(limit, 10) || 20,
                    1
                ),
                100
            );


        const skip =
            (pageNumber - 1) *
            limitNumber;

        const ticketQuery = {
            event: eventId
        };


        if (status) {
            ticketQuery.ticketStatus =
                status;
        }

        const [
            tickets,
            totalTickets
        ] = await Promise.all([

            ticketModel
                .find(ticketQuery)
                .populate(
                    "user",
                    "fullName email"
                )
                .populate(
                    "booking",
                    "quantity totalAmount bookingStatus paymentStatus confirmedAt"
                )
                .sort({
                    createdAt: -1
                })
                .skip(skip)
                .limit(limitNumber)
                .lean(),


            ticketModel.countDocuments(
                ticketQuery
            )
        ]);

        return res.status(200).json({
            success: true,

            message:
                "Event tickets fetched successfully",

            event,

            filters: {
                status:
                    status || "all"
            },

            pagination: {
                currentPage:
                    pageNumber,

                totalPages:
                    Math.ceil(
                        totalTickets /
                        limitNumber
                    ),

                totalTickets,

                limit:
                    limitNumber
            },

            tickets
        });


    } catch (error) {
        console.error(
            "Get event tickets error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch event tickets",
            error:
                error.message
        });
    }
};