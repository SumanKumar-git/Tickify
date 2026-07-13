import mongoose from "mongoose";
import refundModel from "../models/refund.model.js";
import { createNotification } from "../services/notification.service.js";


export const getMyRefunds = async (req, res) => {

    try {

        const userId = req.user._id;

        const refunds = await refundModel
            .find({
                user: userId
            })
            .populate({
                path: "booking",
                select:
                    "event quantity totalAmount bookingStatus paymentStatus cancelledAt",
                populate: {
                    path: "event",
                    select:
                        "title poster startDate endDate venue"
                }
            })
            .populate({
                path: "payment",
                select:
                    "amount currency paymentStatus paymentMethod paidAt"
            })
            .sort({
                createdAt: -1
            });


        return res.status(200).json({
            success: true,
            message: "Refunds fetched successfully",
            count: refunds.length,
            refunds
        });


    } catch (error) {

        console.error(
            "Get my refunds error:",
            error
        );


        return res.status(500).json({
            success: false,
            message: "Failed to fetch refunds",
            error: error.message
        });
    }
};


export const getRefundById = async (req, res) => {

    try {

        const { refundId } = req.params;

        const userId = req.user._id;
        const userRole = req.user.role;


        if (
            !mongoose.Types.ObjectId.isValid(
                refundId
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid refund ID"
            });
        }


        const query = {
            _id: refundId
        };


        if (userRole !== "admin") {

            query.user = userId;
        }


        const refund = await refundModel
            .findOne(query)
            .populate({
                path: "booking",
                select:
                    "event quantity totalAmount bookingStatus paymentStatus cancelledAt confirmedAt",
                populate: {
                    path: "event",
                    select:
                        "title poster startDate endDate venue organizer"
                }
            })
            .populate({
                path: "payment",
                select:
                    "amount currency paymentStatus paymentMethod paymentGateway gatewayOrderId gatewayPaymentId fee tax paidAt"
            })
            .populate({
                path: "user",
                select:
                    "fullName email"
            });


        if (!refund) {

            return res.status(404).json({
                success: false,
                message: "Refund not found"
            });
        }


        return res.status(200).json({
            success: true,
            message:
                "Refund fetched successfully",
            refund
        });


    } catch (error) {

        console.error(
            "Get refund error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch refund",
            error: error.message
        });
    }
};


export const processRefund = async (req, res) => {

    try {

        const { refundId } = req.params;


        if (
            !mongoose.Types.ObjectId.isValid(
                refundId
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid refund ID"
            });
        }

        if (req.user.role !== "admin") {

            return res.status(403).json({
                success: false,
                message:
                    "Only admin can process refunds"
            });
        }


        const refund =
            await refundModel.findOneAndUpdate(

                {
                    _id: refundId,
                    refundStatus: "pending"
                },

                {
                    $set: {
                        refundStatus: "refunded",
                        processedAt: new Date(),
                        failureReason: null
                    }
                },

                {
                    new: true,
                    runValidators: true
                }
            )
            .populate({
                path: "booking",
                select:
                    "quantity totalAmount bookingStatus paymentStatus"
            })
            .populate({
                path: "user",
                select:
                    "fullName email"
            });


        if (!refund) {

            const existingRefund =
                await refundModel.findById(
                    refundId
                );


            if (!existingRefund) {

                return res.status(404).json({
                    success: false,
                    message: "Refund not found"
                });
            }


            return res.status(409).json({
                success: false,
                message:
                    `Refund cannot be processed because its current status is '${existingRefund.refundStatus}'`
            });
        }

        await createNotification({
            user: refund.user._id,
            type: "refund_completed",
            title: "Refund Completed",
            message: `Your refund of ₹${refund.amount} has been processed successfully.`,
            relatedBooking: refund.booking._id,
            relatedRefund: refund._id
        });


        return res.status(200).json({
            success: true,
            message:
                "Refund marked as processed successfully",
            refund
        });


    } catch (error) {

        console.error(
            "Process refund error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Failed to process refund",
            error: error.message
        });
    }
};


// Controller to fetch all refunds in the system for admin view
export const getAllRefundsForAdmin = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admin can view all refunds"
            });
        }

        const refunds = await refundModel.find()
            .populate({
                path: "booking",
                select: "event quantity totalAmount bookingStatus paymentStatus cancelledAt confirmedAt",
                populate: {
                    path: "event",
                    select: "title poster startDate endDate venue organizer"
                }
            })
            .populate({
                path: "payment",
                select: "amount currency paymentStatus paymentMethod paymentGateway gatewayOrderId gatewayPaymentId fee tax paidAt"
            })
            .populate({
                path: "user",
                select: "fullName email"
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "All refunds fetched successfully",
            count: refunds.length,
            refunds
        });
    } catch (error) {
        console.error("Get all refunds error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch refunds",
            error: error.message
        });
    }
};