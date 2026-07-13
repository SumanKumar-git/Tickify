import mongoose from "mongoose";
import userModel from "../models/user.model.js";
import eventModel from "../models/event.model.js";
import bookingModel from "../models/booking.model.js";
import paymentModel from "../models/payment.model.js";
import ticketModel from "../models/ticket.model.js";
import refundModel from "../models/refund.model.js";


//Admin dashboard
export const getAdminDashboard = async (req, res) => {
    try {

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can access the admin dashboard"
            });
        }


        const [
            totalUsers,
            totalOrganizers,
            totalParticipants,
            totalEvents,
            totalRegistrations,
            eventGrowth,
            registrationStatistics,
            popularCategories,
            pendingApprovals,
            pendingApprovalsCount,
            pendingRefundsCount,
            refundedAgg
        ] = await Promise.all([
            userModel.countDocuments(),

            userModel.countDocuments({
                role: "organizer"
            }),

            userModel.countDocuments({
                role: "user"
            }),

            eventModel.countDocuments(),
            bookingModel.countDocuments({
                bookingStatus: "confirmed"
            }),

            eventModel.aggregate([
                {
                    $group: {
                        _id: {
                            year: {
                                $year: "$createdAt"
                            },
                            month: {
                                $month: "$createdAt"
                            }
                        },

                        totalEvents: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1
                    }
                },

                {
                    $project: {
                        _id: 0,

                        year: "$_id.year",
                        month: "$_id.month",

                        totalEvents: 1
                    }
                }
            ]),


            bookingModel.aggregate([
                {
                    $match: {
                        bookingStatus: "confirmed"
                    }
                },

                {
                    $group: {
                        _id: {
                            year: {
                                $year: "$createdAt"
                            },
                            month: {
                                $month: "$createdAt"
                            }
                        },

                        totalBookings: {
                            $sum: 1
                        },

                        totalTickets: {
                            $sum: "$quantity"
                        }
                    }
                },

                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1
                    }
                },

                {
                    $project: {
                        _id: 0,

                        year: "$_id.year",
                        month: "$_id.month",

                        totalBookings: 1,
                        totalTickets: 1
                    }
                }
            ]),

            bookingModel.aggregate([
                {
                    $match: {
                        bookingStatus: "confirmed"
                    }
                },

                {
                    $lookup: {
                        from: "events",
                        localField: "event",
                        foreignField: "_id",
                        as: "event"
                    }
                },

                {
                    $unwind: "$event"
                },

                {
                    $group: {
                        _id: "$event.category",

                        totalBookings: {
                            $sum: 1
                        },

                        totalTicketsSold: {
                            $sum: "$quantity"
                        }
                    }
                },

                {
                    $sort: {
                        totalTicketsSold: -1
                    }
                },

                {
                    $project: {
                        _id: 0,
                        category: "$_id",
                        totalBookings: 1,
                        totalTicketsSold: 1
                    }
                }
            ]),

            eventModel.find({ status: "pending" })
                .populate("organizer", "fullName email")
                .sort({ createdAt: 1 })
                .limit(5),

            eventModel.countDocuments({ status: "pending" }),

            refundModel.countDocuments({ refundStatus: "pending" }),

            refundModel.aggregate([
                { $match: { refundStatus: "refunded" } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ])

        ]);

        const totalRefundedAmount = refundedAgg[0]?.total || 0;


        return res.status(200).json({
            success: true,
            message: "Admin dashboard fetched successfully",

            dashboard: {

                overview: {
                    totalUsers,
                    totalOrganizers,
                    totalParticipants,
                    totalEvents,
                    totalRegistrations,
                    pendingApprovalsCount
                },

                pendingApprovals,

                refundStats: {
                    pendingRefundsCount,
                    totalRefundedAmount
                },

                analytics: {
                    eventGrowth,
                    registrationStatistics,
                    popularCategories
                }
            }
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: "Failed to fetch admin dashboard",
            error: err.message
        });
    }
};

//Organizer dashboard
export const getOrganizerDashboard = async (req, res) => {
    try {

        if (req.user.role !== "organizer") {
            return res.status(403).json({
                success: false,
                message: "Only organizers can access the organizer dashboard"
            });
        }


        const organizerId = new mongoose.Types.ObjectId(
            req.user._id
        );

        const now = new Date();


        const [
            totalEvents,
            registrationStats,
            revenueStats,
            upcomingEvents,
            eventPerformance,
            registrationTrends
        ] = await Promise.all([


            eventModel.countDocuments({
                organizer: organizerId
            }),

            bookingModel.aggregate([

                {
                    $match: {
                        bookingStatus: "confirmed"
                    }
                },

                {
                    $lookup: {
                        from: "events",
                        localField: "event",
                        foreignField: "_id",
                        as: "event"
                    }
                },

                {
                    $unwind: "$event"
                },

                {
                    $match: {
                        "event.organizer": organizerId
                    }
                },

                {
                    $group: {
                        _id: null,

                        totalBookings: {
                            $sum: 1
                        },

                        totalRegistrations: {
                            $sum: "$quantity"
                        }
                    }
                },

                {
                    $project: {
                        _id: 0,
                        totalBookings: 1,
                        totalRegistrations: 1
                    }
                }
            ]),

            paymentModel.aggregate([

                {
                    $match: {
                        paymentStatus: "success"
                    }
                },

                {
                    $lookup: {
                        from: "bookings",
                        localField: "booking",
                        foreignField: "_id",
                        as: "booking"
                    }
                },

                {
                    $unwind: "$booking"
                },

                {
                    $lookup: {
                        from: "events",
                        localField: "booking.event",
                        foreignField: "_id",
                        as: "event"
                    }
                },
                {
                    $unwind: "$event"
                },
                {
                    $match: {
                        "event.organizer": organizerId
                    }
                },

                {
                    $group: {
                        _id: null,
                        totalRevenue: {
                            $sum: "$amount"
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalRevenue: 1
                    }
                }
            ]),

            eventModel
                .find({
                    organizer: organizerId,

                    status: "approved",

                    startDate: {
                        $gt: now
                    }
                })
                .select(
                    "title category startDate endDate venue poster totalSeats availableSeats ticketPrice"
                )
                .sort({
                    startDate: 1
                })
                .limit(5)
                .lean(),

            bookingModel.aggregate([

                {
                    $match: {
                        bookingStatus: "confirmed"
                    }
                },
                {
                    $lookup: {
                        from: "events",
                        localField: "event",
                        foreignField: "_id",
                        as: "event"
                    }
                },
                {
                    $unwind: "$event"
                },
                {
                    $match: {
                        "event.organizer": organizerId
                    }
                },
                {
                    $group: {
                        _id: "$event._id",
                        title: {
                            $first: "$event.title"
                        },
                        totalSeats: {
                            $first: "$event.totalSeats"
                        },
                        availableSeats: {
                            $first: "$event.availableSeats"
                        },
                        totalBookings: {
                            $sum: 1
                        },
                        ticketsSold: {
                            $sum: "$quantity"
                        },
                        revenue: {
                            $sum: "$totalAmount"
                        }
                    }
                },
                {
                    $addFields: {
                        occupancyRate: {
                            $cond: [
                                {
                                    $gt: [
                                        "$totalSeats",
                                        0
                                    ]
                                },
                                {
                                    $multiply: [
                                        {
                                            $divide: [
                                                "$ticketsSold",
                                                "$totalSeats"
                                            ]
                                        },
                                        100
                                    ]
                                },
                                0
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        ticketsSold: -1
                    }
                },
                {
                    $project: {
                        _id: 0,
                        eventId: "$_id",
                        title: 1,
                        totalSeats: 1,
                        availableSeats: 1,
                        totalBookings: 1,
                        ticketsSold: 1,
                        revenue: 1,
                        occupancyRate: 1
                    }
                }
            ]),

            bookingModel.aggregate([
                {
                    $match: {
                        bookingStatus: "confirmed"
                    }
                },
                {
                    $lookup: {
                        from: "events",
                        localField: "event",
                        foreignField: "_id",
                        as: "event"
                    }
                },
                {
                    $unwind: "$event"
                },
                {
                    $match: {
                        "event.organizer": organizerId
                    }
                },
                {
                    $group: {
                        _id: {
                            year: {
                                $year: "$createdAt"
                            },
                            month: {
                                $month: "$createdAt"
                            }
                        },
                        totalBookings: {
                            $sum: 1
                        },
                        totalRegistrations: {
                            $sum: "$quantity"
                        }
                    }
                },
                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1
                    }
                },
                {
                    $project: {
                        _id: 0,
                        year: "$_id.year",
                        month: "$_id.month",
                        totalBookings: 1,
                        totalRegistrations: 1
                    }
                }
            ])
        ]);

        return res.status(200).json({
            success: true,
            message: "Organizer dashboard fetched successfully",
            dashboard: {
                overview: {
                    eventsCreated: totalEvents,
                    totalBookings:
                        registrationStats[0]?.totalBookings || 0,
                    totalRegistrations:
                        registrationStats[0]?.totalRegistrations || 0,
                    revenueGenerated:
                        revenueStats[0]?.totalRevenue || 0
                },

                upcomingEvents,

                analytics: {
                    eventPerformance,
                    registrationTrends
                }
            }
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: "Failed to fetch organizer dashboard",
            error: err.message
        });
    }
};

//Participant dashboard
export const getParticipantDashboard = async (req, res) => {
    try {

        if (req.user.role !== "user") {
            return res.status(403).json({
                success: false,
                message: "Only participants can access the participant dashboard"
            });
        }


        const userId = req.user._id;
        const now = new Date();


        const [
            registeredEvents,
            upcomingEvents,
            ticketHistory
        ] = await Promise.all([

            bookingModel
                .find({
                    user: userId,
                    bookingStatus: "confirmed"
                })
                .populate({
                    path: "event",
                    select:
                        "title category startDate endDate venue poster ticketPrice status"
                })
                .select(
                    "event quantity totalAmount bookingStatus paymentStatus confirmedAt createdAt"
                )
                .sort({
                    createdAt: -1
                })
                .lean(),

            bookingModel.aggregate([
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(
                            userId
                        ),
                        bookingStatus: "confirmed"
                    }
                },
                {
                    $lookup: {
                        from: "events",
                        localField: "event",
                        foreignField: "_id",
                        as: "event"
                    }
                },
                {
                    $unwind: "$event"
                },
                {
                    $match: {
                        "event.startDate": {
                            $gt: now
                        },
                        "event.status": "approved"
                    }
                },
                {
                    $sort: {
                        "event.startDate": 1
                    }
                },
                {
                    $limit: 5
                },
                {
                    $project: {
                        _id: 0,
                        bookingId: "$_id",
                        quantity: 1,
                        bookingStatus: 1,
                        event: {
                            _id: "$event._id",
                            title: "$event.title",
                            category: "$event.category",
                            startDate: "$event.startDate",
                            endDate: "$event.endDate",
                            venue: "$event.venue",
                            poster: "$event.poster"
                        }
                    }
                }
            ]),

            ticketModel
                .find({
                    user: userId
                })
                .populate({
                    path: "event",

                    select:
                        "title category startDate endDate venue poster"
                })
                .populate({
                    path: "booking",

                    select:
                        "quantity totalAmount bookingStatus paymentStatus confirmedAt"
                })
                .select(
                    "ticketNumber ticketSequence ticketStatus checkedInAt event booking createdAt"
                )
                .sort({
                    createdAt: -1
                })
                .lean()

        ]);


        return res.status(200).json({
            success: true,
            message: "Participant dashboard fetched successfully",

            dashboard: {

                profileInformation: {
                    _id: req.user._id,
                    fullName: req.user.fullName,
                    email: req.user.email,
                    profilePhoto:
                        req.user.profilePhoto || null,
                    role: req.user.role,
                    isEmailVerified:
                        req.user.isEmailVerified
                },

                overview: {
                    totalRegisteredEvents:
                        registeredEvents.length,

                    upcomingEventsCount:
                        upcomingEvents.length,

                    totalTickets:
                        ticketHistory.length
                },

                registeredEvents,

                upcomingEvents,

                ticketHistory
            }
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: "Failed to fetch participant dashboard",
            error: err.message
        });
    }
};