import mongoose from "mongoose";
import bookingModel from "../models/booking.model.js";
import eventModel from "../models/event.model.js";
import refundModel from "../models/refund.model.js"
import ticketModel from "../models/ticket.model.js";
import { createBookingSchema } from "../validations/booking.validation.js";
import { createNotification } from "../services/notification.service.js";
import { ZodError } from "zod";

//Controller to initiate the booking i.e. reserve the seat and wait for payment confirmation
export const createBooking = async (req, res) => {
    const session = await mongoose.startSession();
    try{
        const validatedData = createBookingSchema.parse(req.body);
        const {eventId, quantity} = validatedData;
        const userId = req.user._id;

        session.startTransaction();

        const event = await eventModel.findOne({
            _id: eventId,
            status: "approved",
            startDate: { $gt : new Date()}
        }).session(session);

        if(!event){
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Event not found or booking is closed"
            })
        };

        if (event.organizer.toString() === userId.toString()) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "You cannot book your own event"
            });
        }

        const updatedEvent = await eventModel.findOneAndUpdate(
            {
                _id: eventId,
                status: "approved",
                startDate: { $gt: new Date() },
                availableSeats: { $gte: quantity }
            },
            {
                $inc: {
                    availableSeats: -quantity
                }
            },
            {
                new: true,
                session
            }
        );

        if (!updatedEvent) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Not enough seats available"
            });
        }

        const totalAmount = event.ticketPrice * quantity;

        const booking = new bookingModel({
            user: userId,
            event: event._id,
            quantity,
            totalAmount,
            bookingStatus: "pending",
            paymentStatus: "not_started",
            reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        await booking.save({ session });

        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            message: "Booking initiated successfully. Waiting for payment...",
            booking
        })
    }
    catch(error){
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: error.issues[0].message
            });
        }
        console.error("Create booking error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create booking",
            error: error.message
        });
    }
    finally{
        await session.endSession();
    }
}

//Controller to get logged in user booking
export const getMyBooking = async (req, res) => {
    try{
        const userId = req.user._id;

        const bookings = await bookingModel.find({
            user: userId
        }).populate("event", "title poster category startDate endDate venue ticketPrice status")
        .populate("payment", "amount paymentGateway paymentStatus")
        .populate("tickets", "ticketNumber ticketStatus")
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Bookings fetched successfully",
            count: bookings.length,
            booking: bookings
        })
    }catch(error){
        console.error("Get my booking error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: error.message
        })
    }
};

//Controller to get booking by Id
export const getBookingById =  async (req, res) => {
    try{
        const {bookingId} = req.params;
        const userId = req.user._id;

        if(!mongoose.Types.ObjectId.isValid(bookingId)){
            return res.status(400).json({
                success: false,
                message: "Invalid Booking Id"
            })
        };

        const booking = await bookingModel.findOne({
            _id: bookingId,
            user: userId
        }).populate({
            path: "event",
            select: "title poster category startDate endDate venue ticketPrice status organizer",
            populate: {
                path: "organizer",
                select: "fullName email"
            }
        })
        .populate("payment", "amount paymentGateway paymentStatus createdAt")
        .populate("tickets");

        if(!booking){
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Booking fetched successfully",
            booking
        })
    }catch(error){
        console.log("Get booking error : ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch booking",
            error: error.message
        })
    }
};

//Controller to cancel booking by user
export const cancelBooking = async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid booking ID"
        });
    }

    const session = await mongoose.startSession();

    try {
        let cancelledBooking;
        let cancelledTicketsResult;
        let refund = null;

        await session.withTransaction(async () => {

            const booking = await bookingModel
                .findOne({
                    _id: bookingId,
                    user: userId
                })
                .populate("event")
                .populate("payment")
                .session(session);

            if (!booking) {
                throw new Error("Booking not found.");
            }

            if (booking.bookingStatus === "cancelled") {
                throw new Error("Booking has already been cancelled.");
            }

            if (booking.event.startDate <= new Date()) {
                throw new Error(
                    "Booking cannot be cancelled after the event has started."
                );
            }
            if (
                booking.bookingStatus === "pending" &&
                booking.paymentStatus === "not_started"
            ) {

                const updatedEvent =
                    await eventModel.findOneAndUpdate(
                        {
                            _id: booking.event._id
                        },
                        {
                            $inc: {
                                availableSeats: booking.quantity
                            }
                        },
                        {
                            new: true,
                            session
                        }
                    );

                if (!updatedEvent) {
                    throw new Error(
                        "Failed to restore available seats."
                    );
                }

                cancelledBooking =
                    await bookingModel.findOneAndUpdate(
                        {
                            _id: booking._id,
                            bookingStatus: "pending",
                            paymentStatus: "not_started"
                        },
                        {
                            $set: {
                                bookingStatus: "cancelled",
                                cancelledAt: new Date(),
                                reservationExpiresAt: null
                            }
                        },
                        {
                            new: true,
                            session
                        }
                    );

                if (!cancelledBooking) {
                    throw new Error(
                        "Booking state changed while cancelling."
                    );
                }

                await createNotification({
                    user: booking.user,
                    type: "booking_cancelled",
                    title: "Booking Cancelled",
                    message: `Your booking for "${booking.event.title}" has been cancelled successfully.`,
                    relatedEvent: booking.event._id,
                    relatedBooking: booking._id,
                    session
                });

                return;
            }

            if (
                booking.bookingStatus === "pending" &&
                booking.paymentStatus === "initiated"
            ) {
                throw new Error(
                    "Payment is currently being processed. Please wait until payment verification completes."
                );
            }

            if (
                booking.bookingStatus === "confirmed" &&
                booking.paymentStatus === "success"
            ) {

                const updatedEvent =
                    await eventModel.findOneAndUpdate(
                        {
                            _id: booking.event._id
                        },
                        {
                            $inc: {
                                availableSeats: booking.quantity
                            }
                        },
                        {
                            new: true,
                            session
                        }
                    );

                if (!updatedEvent) {
                    throw new Error(
                        "Failed to restore available seats."
                    );
                }

                cancelledBooking =
                    await bookingModel.findOneAndUpdate(
                        {
                            _id: booking._id,
                            bookingStatus: "confirmed",
                            paymentStatus: "success"
                        },
                        {
                            $set: {
                                bookingStatus: "cancelled",
                                cancelledAt: new Date()
                            }
                        },
                        {
                            new: true,
                            session
                        }
                    );

                if (!cancelledBooking) {
                    throw new Error(
                        "Booking state changed while cancelling."
                    );
                }

                cancelledTicketsResult =
                    await ticketModel.updateMany(
                        {
                            booking: booking._id,
                            ticketStatus: "active"
                        },
                        {
                            $set: {
                                ticketStatus: "cancelled"
                            }
                        },
                        {
                            session
                        }
                    );

                refund = await refundModel.create(
                    [
                        {
                            booking: booking._id,
                            payment: booking.payment._id,
                            user: booking.user,
                            amount: booking.totalAmount,
                            refundStatus: "pending",
                            reason: "Booking cancelled by participant."
                        }
                    ],
                    {
                        session
                    }
                );

                await createNotification({
                    user: booking.user,
                    type: "booking_cancelled",
                    title: "Booking Cancelled",
                    message: `Your booking for "${booking.event.title}" has been cancelled successfully.`,
                    relatedEvent: booking.event._id,
                    relatedBooking: booking._id,
                    session
                });


                await createNotification({
                    user: booking.user,
                    type: "refund_pending",
                    title: "Refund Pending",
                    message: `A refund of ₹${booking.totalAmount} has been created and is awaiting processing.`,
                    relatedEvent: booking.event._id,
                    relatedBooking: booking._id,
                    relatedRefund: refund[0]._id,
                    session
                });


                return;
            }

            throw new Error(
                "Booking cannot be cancelled in its current state."
            );

        });

        return res.status(200).json({
            success: true,
            message: "Booking cancelled successfully.",
            booking: cancelledBooking,
            refund:
                refund?.length > 0
                    ? refund[0]
                    : null
        });

    } catch (error) {

        console.error(
            "Cancel booking error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });

    } finally {

        session.endSession();

    }
};

export const getEventRegistrations = async (req, res) => {
    try {
        const { eventId } = req.params;

        const organizerId = req.user._id;

        const {
            search,
            bookingStatus,
            attendanceStatus,
        } = req.query;


        // ---------------- VALIDATE EVENT ID ----------------

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID"
            });
        }


        // ---------------- ROLE CHECK ----------------

        if (req.user.role !== "organizer") {
            return res.status(403).json({
                success: false,
                message: "Only organizers can view event registrations"
            });
        }


        // ---------------- VERIFY EVENT OWNERSHIP ----------------

        const event = await eventModel
            .findOne({
                _id: eventId,
                organizer: organizerId
            })
            .select(
                "title startDate endDate totalSeats availableSeats"
            )
            .lean();


        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found or you are not authorized to access it"
            });
        }


        // ---------------- PAGINATION ----------------

        const page = Math.max(
            Number(req.query.page) || 1,
            1
        );

        const limit = Math.min(
            Math.max(Number(req.query.limit) || 10, 1),
            50
        );

        const skip = (page - 1) * limit;


        // ---------------- MATCH FILTER ----------------

        const matchStage = {
            event: new mongoose.Types.ObjectId(eventId)
        };


        if (
            bookingStatus &&
            ["pending", "confirmed", "cancelled"].includes(
                bookingStatus
            )
        ) {
            matchStage.bookingStatus = bookingStatus;
        }


        // ---------------- AGGREGATION PIPELINE ----------------

        const pipeline = [

            {
                $match: matchStage
            },


            // ---------------- PARTICIPANT DETAILS ----------------

            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "participant"
                }
            },

            {
                $unwind: "$participant"
            },


            // ---------------- TICKET DETAILS ----------------

            {
                $lookup: {
                    from: "tickets",
                    localField: "_id",
                    foreignField: "booking",
                    as: "ticketDetails"
                }
            },


            // ---------------- ATTENDANCE CALCULATION ----------------

            {
                $addFields: {

                    totalTickets: {
                        $size: "$ticketDetails"
                    },


                    checkedInTickets: {
                        $size: {
                            $filter: {
                                input: "$ticketDetails",
                                as: "ticket",

                                cond: {
                                    $eq: [
                                        "$$ticket.ticketStatus",
                                        "used"
                                    ]
                                }
                            }
                        }
                    },


                    activeTickets: {
                        $size: {
                            $filter: {
                                input: "$ticketDetails",
                                as: "ticket",

                                cond: {
                                    $eq: [
                                        "$$ticket.ticketStatus",
                                        "active"
                                    ]
                                }
                            }
                        }
                    },


                    cancelledTickets: {
                        $size: {
                            $filter: {
                                input: "$ticketDetails",
                                as: "ticket",

                                cond: {
                                    $eq: [
                                        "$$ticket.ticketStatus",
                                        "cancelled"
                                    ]
                                }
                            }
                        }
                    }
                }
            },


            // ---------------- ATTENDANCE STATUS ----------------

            {
                $addFields: {

                    attendanceStatus: {

                        $switch: {

                            branches: [

                                {
                                    case: {
                                        $and: [
                                            {
                                                $gt: [
                                                    "$totalTickets",
                                                    0
                                                ]
                                            },

                                            {
                                                $eq: [
                                                    "$checkedInTickets",
                                                    "$totalTickets"
                                                ]
                                            }
                                        ]
                                    },

                                    then: "attended"
                                },


                                {
                                    case: {
                                        $gt: [
                                            "$checkedInTickets",
                                            0
                                        ]
                                    },

                                    then: "partially_attended"
                                }

                            ],

                            default: "not_attended"
                        }
                    }
                }
            }

        ];


        // ---------------- SEARCH ----------------

        if (search?.trim()) {

            const escapedSearch = search
                .trim()
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


            pipeline.push({
                $match: {

                    $or: [

                        {
                            "participant.fullName": {
                                $regex: escapedSearch,
                                $options: "i"
                            }
                        },

                        {
                            "participant.email": {
                                $regex: escapedSearch,
                                $options: "i"
                            }
                        }

                    ]
                }
            });
        }


        // ---------------- ATTENDANCE FILTER ----------------

        if (
            attendanceStatus &&
            [
                "attended",
                "partially_attended",
                "not_attended"
            ].includes(attendanceStatus)
        ) {

            pipeline.push({
                $match: {
                    attendanceStatus
                }
            });
        }


        // ---------------- RESPONSE SHAPE ----------------

        pipeline.push({

            $project: {

                _id: 0,

                bookingId: "$_id",


                participant: {
                    _id: "$participant._id",
                    fullName: "$participant.fullName",
                    email: "$participant.email",
                    profilePhoto: "$participant.profilePhoto"
                },


                quantity: 1,

                totalAmount: 1,

                bookingStatus: 1,

                paymentStatus: 1,

                confirmedAt: 1,

                bookingDate: "$createdAt",


                attendance: {

                    status: "$attendanceStatus",

                    totalTickets: "$totalTickets",

                    checkedIn: "$checkedInTickets",

                    remaining: "$activeTickets",

                    cancelled: "$cancelledTickets"
                }
            }
        });


        // ---------------- SORTING ----------------

        pipeline.push({
            $sort: {
                bookingDate: -1
            }
        });


        // ---------------- PAGINATION + COUNT ----------------

        pipeline.push({

            $facet: {

                registrations: [

                    {
                        $skip: skip
                    },

                    {
                        $limit: limit
                    }

                ],


                metadata: [

                    {
                        $count: "totalRegistrations"
                    }

                ],


                statistics: [

                    {
                        $group: {

                            _id: null,

                            totalBookings: {
                                $sum: 1
                            },

                            totalTickets: {
                                $sum: "$attendance.totalTickets"
                            },

                            totalCheckedIn: {
                                $sum: "$attendance.checkedIn"
                            },

                            totalRemaining: {
                                $sum: "$attendance.remaining"
                            }
                        }
                    }

                ]
            }
        });


        const result =
            await bookingModel.aggregate(pipeline);


        const registrations =
            result[0]?.registrations || [];


        const totalRegistrations =
            result[0]?.metadata[0]
                ?.totalRegistrations || 0;


        const statistics =
            result[0]?.statistics[0] || {
                totalBookings: 0,
                totalTickets: 0,
                totalCheckedIn: 0,
                totalRemaining: 0
            };


        // ---------------- RESPONSE ----------------

        return res.status(200).json({

            success: true,

            message:
                "Event registrations fetched successfully",


            event: {
                _id: event._id,

                title: event.title,

                startDate: event.startDate,

                endDate: event.endDate,

                totalSeats: event.totalSeats,

                availableSeats:
                    event.availableSeats
            },


            statistics: {
                ...statistics,

                attendanceRate:
                    statistics.totalTickets > 0
                        ? Number(
                            (
                                statistics.totalCheckedIn /
                                statistics.totalTickets *
                                100
                            ).toFixed(2)
                        )
                        : 0
            },


            registrations,


            pagination: {

                currentPage: page,

                totalPages:
                    Math.ceil(
                        totalRegistrations / limit
                    ),

                totalRegistrations,

                registrationsPerPage: limit,

                hasNextPage:
                    page <
                    Math.ceil(
                        totalRegistrations / limit
                    ),

                hasPreviousPage:
                    page > 1
            }
        });


    } catch (err) {

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch event registrations",
            error: err.message
        });
    }
};

