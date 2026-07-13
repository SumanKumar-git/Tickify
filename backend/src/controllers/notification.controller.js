import mongoose from "mongoose";
import notificationModel from "../models/notification.model.js";

export const getMyNotifications = async (req, res) => {

    try {

        const userId = req.user._id;

        const page =
            Math.max(
                Number.parseInt(req.query.page) || 1,
                1
            );

        const limit =
            Math.min(
                Math.max(
                    Number.parseInt(req.query.limit) || 20,
                    1
                ),
                50
            );

        const skip =
            (page - 1) * limit;


        const filter = {
            user: userId
        };

        if (
            req.query.unreadOnly === "true"
        ) {

            filter.isRead = false;
        }


        const [
            notifications,
            totalNotifications,
            unreadCount
        ] = await Promise.all([

            notificationModel
                .find(filter)
                .populate({
                    path: "relatedEvent",
                    select:
                        "title poster startDate status"
                })
                .populate({
                    path: "relatedBooking",
                    select:
                        "bookingStatus paymentStatus quantity totalAmount"
                })
                .populate({
                    path: "relatedRefund",
                    select:
                        "amount refundStatus processedAt"
                })
                .sort({
                    createdAt: -1
                })
                .skip(skip)
                .limit(limit),


            notificationModel.countDocuments(
                filter
            ),


            notificationModel.countDocuments({
                user: userId,
                isRead: false
            })

        ]);


        const totalPages =
            Math.ceil(
                totalNotifications / limit
            );


        return res.status(200).json({

            success: true,

            message:
                "Notifications fetched successfully",

            unreadCount,

            pagination: {
                currentPage: page,
                totalPages,
                totalNotifications,
                limit
            },

            notifications
        });


    } catch (error) {

        console.error(
            "Get notifications error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch notifications"
        });
    }
};


export const getUnreadNotificationCount =
    async (req, res) => {

        try {

            const userId =
                req.user._id;


            const unreadCount =
                await notificationModel.countDocuments({
                    user: userId,
                    isRead: false
                });


            return res.status(200).json({
                success: true,
                unreadCount
            });


        } catch (error) {

            console.error(
                "Unread notification count error:",
                error
            );


            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch unread notification count"
            });
        }
    };


export const markNotificationAsRead =
    async (req, res) => {

        try {

            const { notificationId } =
                req.params;

            const userId =
                req.user._id;


            if (
                !mongoose.Types.ObjectId.isValid(
                    notificationId
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid notification ID"
                });
            }


            const notification =
                await notificationModel.findOneAndUpdate(

                    {
                        _id: notificationId,
                        user: userId
                    },

                    {
                        $set: {
                            isRead: true
                        }
                    },

                    {
                        new: true
                    }
                );


            if (!notification) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Notification not found"
                });
            }


            return res.status(200).json({

                success: true,

                message:
                    "Notification marked as read",

                notification
            });


        } catch (error) {

            console.error(
                "Mark notification as read error:",
                error
            );


            return res.status(500).json({
                success: false,
                message:
                    "Failed to update notification"
            });
        }
    };

export const markAllNotificationsAsRead =
    async (req, res) => {

        try {

            const userId =
                req.user._id;


            const result =
                await notificationModel.updateMany(

                    {
                        user: userId,
                        isRead: false
                    },

                    {
                        $set: {
                            isRead: true
                        }
                    }
                );


            return res.status(200).json({

                success: true,

                message:
                    "All notifications marked as read",

                modifiedCount:
                    result.modifiedCount
            });


        } catch (error) {

            console.error(
                "Mark all notifications as read error:",
                error
            );


            return res.status(500).json({
                success: false,
                message:
                    "Failed to update notifications"
            });
        }
    };


export const deleteNotification =
    async (req, res) => {

        try {

            const { notificationId } =
                req.params;

            const userId =
                req.user._id;


            if (
                !mongoose.Types.ObjectId.isValid(
                    notificationId
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid notification ID"
                });
            }


            const notification =
                await notificationModel.findOneAndDelete({
                    _id: notificationId,
                    user: userId
                });


            if (!notification) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Notification not found"
                });
            }


            return res.status(200).json({
                success: true,
                message:
                    "Notification deleted successfully"
            });


        } catch (error) {

            console.error(
                "Delete notification error:",
                error
            );


            return res.status(500).json({
                success: false,
                message:
                    "Failed to delete notification"
            });
        }
    };