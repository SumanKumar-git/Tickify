import mongoose from "mongoose";
import crypto from "crypto";
import bookingModel from "../models/booking.model.js";
import paymentModel from "../models/payment.model.js";
import razorpayInstance from "../configs/razorpay.js";
import refundModel from "../models/refund.model.js";
import { generateTicketsForBooking } from "../services/ticket.service.js";
import { createNotification } from "../services/notification.service.js";
import { sendTicketEmail } from "../services/ticketEmail.service.js";


export const initiatePayment = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { bookingId } = req.params;
        const userId = req.user._id;


        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }


        const booking = await bookingModel.findOne({
            _id: bookingId,
            user: userId
        });


        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }


        if (booking.bookingStatus !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Payment cannot be initiated for this booking"
            });
        }

        if (booking.payment) {
            const existingPayment = await paymentModel.findById(
                booking.payment
            );

            if (existingPayment &&
                booking.paymentStatus === "initiated" &&
                existingPayment.paymentStatus === "pending") {
                return res.status(200).json({
                    success: true,
                    message: "Payment already initiated",

                    payment: {
                        keyId: process.env.RAZORPAY_KEY_ID,
                        orderId: existingPayment.gatewayOrderId,
                        amount: Math.round(
                            existingPayment.amount * 100
                        ),
                        currency: existingPayment.currency,
                        bookingId: booking._id
                    }
                });
            }
        }


        if (booking.paymentStatus !== "not_started") {
            return res.status(400).json({
                success: false,
                message: "Payment cannot be initiated for this booking"
            });
        }


        if (!booking.reservationExpiresAt || booking.reservationExpiresAt <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Booking reservation has expired"
            });
        }


        // Razorpay expects amount in the smallest currency unit
        const amountInPaise = Math.round(
            booking.totalAmount * 100
        );


        const razorpayOrder = await razorpayInstance.orders.create({
            amount: amountInPaise,

            currency: "INR",

            receipt: `booking_${booking._id}`,

            notes: {
                bookingId: booking._id.toString(),
                userId: userId.toString()
            }
        });


        session.startTransaction();


        const payment = new paymentModel({
            booking: booking._id,

            user: userId,

            currency: razorpayOrder.currency,

            paymentGateway: "razorpay",

            gatewayOrderId: razorpayOrder.id,

            amount: booking.totalAmount,

            paymentStatus: "pending"
        });


        await payment.save({
            session
        });


        const updatedBooking = await bookingModel.findOneAndUpdate(
            {
                _id: booking._id,

                user: userId,

                bookingStatus: "pending",

                paymentStatus: "not_started",

                payment: null,

                reservationExpiresAt: {
                    $gt: new Date()
                }
            },

            {
                $set: {
                    payment: payment._id,
                    reservationExpiresAt: null,
                    paymentStatus: "initiated",
                    paymentExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
                }
            },

            {
                new: true,
                session
            }
        );


        if (!updatedBooking) {
            await session.abortTransaction();

            return res.status(409).json({
                success: false,
                message: "Booking state changed during payment initiation"
            });
        }


        await session.commitTransaction();


        return res.status(201).json({
            success: true,
            message: "Payment initiated successfully",
            payment: {
                keyId: process.env.RAZORPAY_KEY_ID,
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                bookingId: booking._id
            }
        });

    }catch(error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Payment already initiated for this booking"
            });
        }

        console.error(
            "Initiate Razorpay payment error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to initiate payment"
        });

    }finally{
        await session.endSession();
    }
};

//Controller to verify the payment and generate the ticket
export const verifyPayment = async (req, res) => {

    const session = await mongoose.startSession();

    try {
        const {
            bookingId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        } = req.body;

        const userId = req.user._id;

        if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification details are required"
            });
        }
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }

        const booking = await bookingModel.findOne({
            _id: bookingId,
            user: userId
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        if (booking.bookingStatus === "confirmed" && booking.paymentStatus === "success") {
            const existingBooking = await bookingModel.findById(booking._id).populate("tickets").populate("payment");

            return res.status(200).json({
                success: true,
                message: "Payment already verified",
                booking: existingBooking
            });
        }

        if (booking.bookingStatus !== "pending" || booking.paymentStatus !== "initiated") {
            return res.status(409).json({
                success: false,
                message: "Booking is not awaiting payment verification"
            });
        }


        if (!booking.payment) {

            return res.status(400).json({
                success: false,
                message: "No payment is associated with this booking"
            });
        }

        const payment = await paymentModel.findOne({
            _id: booking.payment,
            booking: booking._id,
            user: userId
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found"
            });
        }

        if (payment.paymentStatus !== "pending") {
            return res.status(409).json({
                success: false,
                message: "Payment has already been processed"
            });
        }

        if (payment.gatewayOrderId !== razorpayOrderId) {
            return res.status(400).json({
                success: false,
                message: "Invalid Razorpay order ID"
            });
        }

        const generatedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${payment.gatewayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

        const generatedBuffer = Buffer.from(
            generatedSignature,
            "hex"
        );

        const receivedBuffer = Buffer.from(
            razorpaySignature,
            "hex"
        );

        const isSignatureValid = generatedBuffer.length === receivedBuffer.length &&
            crypto.timingSafeEqual(generatedBuffer, receivedBuffer);


        if (!isSignatureValid) {
            return res.status(400).json({
                success: false,
                message: "Payment signature verification failed"
            });
        }

        const razorpayPayment = await razorpayInstance.payments.fetch(razorpayPaymentId);

        if (razorpayPayment.order_id !== payment.gatewayOrderId){
            return res.status(400).json({
                success: false,
                message: "Payment does not belong to this order"
            });
        }
        if (razorpayPayment.amount !== Math.round(payment.amount * 100)) {
            return res.status(400).json({
                success: false,
                message: "Payment amount mismatch"
            });
        }
        if (razorpayPayment.currency !== payment.currency){
            return res.status(400).json({
                success: false,
                message: "Payment currency mismatch"
            });
        }

        if (razorpayPayment.status !== "captured") {
            return res.status(409).json({
                success: false,
                message: "Payment has not been captured yet"
            });
        }

        let confirmedBooking;
        let updatedPayment;
        let tickets;

        await session.withTransaction(async () => {
            confirmedBooking =
                await bookingModel.findOneAndUpdate(
                    {
                        _id: booking._id,
                        user: userId,
                        bookingStatus: "pending",
                        paymentStatus: "initiated",
                        payment: payment._id
                    },
                    {
                        $set: {
                            bookingStatus: "confirmed",
                            paymentStatus: "success",
                            confirmedAt: new Date(),
                            reservationExpiresAt: null,
                            paymentExpiresAt: null
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

            if (!confirmedBooking) {

                const latestBooking =
                    await bookingModel
                        .findById(booking._id)
                        .session(session);

                if (
                    latestBooking &&
                    latestBooking.bookingStatus ===
                        "confirmed" &&
                    latestBooking.paymentStatus ===
                        "success"
                ) {
                    return;
                }

                throw new Error(
                    "Booking state changed during payment verification."
                );
            }

            updatedPayment =
                await paymentModel.findOneAndUpdate(
                    {
                        _id: payment._id,
                        booking: booking._id,
                        user: userId,
                        paymentStatus: "pending"
                    },
                    {
                        $set: {
                            paymentStatus: "success",
                            gatewayPaymentId: razorpayPayment.id,
                            gatewaySignature: razorpaySignature,
                            paidAt: new Date(razorpayPayment.created_at * 1000),
                            reconciliationAttempts: 0,
                            paymentMethod: razorpayPayment.method ?? null,
                            bank: razorpayPayment.bank ?? null,
                            wallet: razorpayPayment.wallet ?? null,
                            vpa: razorpayPayment.vpa ?? null,
                            fee: razorpayPayment.fee ?? null,
                            tax: razorpayPayment.tax ?? null
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );
            if (!updatedPayment) {
                throw new Error(
                    "Unable to update payment."
                );
            }
            tickets =
                await generateTicketsForBooking({
                    booking: confirmedBooking,
                    session
                });

            await createNotification({
                user: confirmedBooking.user,
                type: "booking_confirmed",
                title: "Booking Confirmed",
                message: "Your payment was successful and your booking has been confirmed.",
                relatedEvent: confirmedBooking.event,
                relatedBooking: confirmedBooking._id,
                session
            });
        });

        // Send tickets via email if the booking was confirmed just now
        if (confirmedBooking) {
            sendTicketEmail(confirmedBooking._id).catch(err =>
                console.error("[verifyPayment] Error sending ticket email:", err)
            );
        }

        const finalBooking =
            await bookingModel
                .findById(booking._id)
                .populate("tickets")
                .populate("payment");
        if (
            !confirmedBooking &&
            finalBooking &&
            finalBooking.bookingStatus === "confirmed" &&
            finalBooking.paymentStatus ===
                "success"
        ) {
            return res.status(200).json({
                success: true,
                message: "Payment already verified",
                booking: finalBooking
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Payment verified and booking confirmed successfully",
            booking: finalBooking,
            payment: updatedPayment,
            tickets
        });

    } catch (error) {

        console.error(
            "Verify payment error:",
            error
        );

        if (
            error?.errorLabels?.includes(
                "TransientTransactionError"
            )
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Payment verification is being processed. Please retry."
            });
        }

        if (
            error.message ===
            "Booking state changed during payment verification."
        ) {

            const latestBooking =
                await bookingModel
                    .findById(req.body.bookingId)
                    .populate("tickets")
                    .populate("payment");

            if (
                latestBooking &&
                latestBooking.bookingStatus ===
                    "confirmed" &&
                latestBooking.paymentStatus ===
                    "success"
            ) {
                return res.status(200).json({
                    success: true,
                    message:
                        "Payment already verified",
                    booking: latestBooking
                });
            }

            return res.status(409).json({
                success: false,
                message:
                    "Booking state changed during payment verification."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to verify payment",
            error: error.message
        });

    } finally {

        await session.endSession();

    }
};

// Controller to fetch all payments/transactions for the logged-in user
export const getMyPayments = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch payments
        const payments = await paymentModel.find({ user: userId })
            .populate({
                path: "booking",
                select: "event quantity totalAmount bookingStatus paymentStatus",
                populate: {
                    path: "event",
                    select: "title poster startDate endDate venue"
                }
            })
            .lean();

        // Fetch refunds
        const refunds = await refundModel.find({ user: userId })
            .populate({
                path: "booking",
                select: "event quantity totalAmount bookingStatus paymentStatus",
                populate: {
                    path: "event",
                    select: "title poster startDate endDate venue"
                }
            })
            .populate("payment")
            .lean();

        // Combine them into a single transactions list!
        const paymentTx = payments.map(p => ({
            _id: p._id,
            type: "payment",
            amount: p.amount,
            currency: p.currency,
            paymentStatus: p.paymentStatus,
            paymentGateway: p.paymentGateway,
            gatewayOrderId: p.gatewayOrderId,
            gatewayPaymentId: p.gatewayPaymentId,
            paymentMethod: p.paymentMethod,
            fee: p.fee,
            tax: p.tax,
            paidAt: p.paidAt,
            booking: p.booking,
            createdAt: p.createdAt
        }));

        const refundTx = refunds.map(r => ({
            _id: r._id,
            type: "refund",
            amount: r.amount,
            currency: r.payment?.currency || "INR",
            paymentStatus: r.refundStatus, // "pending", "failed", "refunded"
            paymentGateway: r.payment?.paymentGateway,
            gatewayOrderId: r.payment?.gatewayOrderId,
            gatewayPaymentId: r.gatewayRefundId || r.payment?.gatewayPaymentId,
            paymentMethod: r.payment?.paymentMethod,
            fee: r.payment?.fee,
            tax: r.payment?.tax,
            paidAt: r.processedAt,
            booking: r.booking,
            reason: r.reason,
            createdAt: r.createdAt
        }));

        const transactions = [...paymentTx, ...refundTx].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.status(200).json({
            success: true,
            message: "Transactions fetched successfully",
            count: transactions.length,
            payments: transactions
        });
    } catch (error) {
        console.error("Get my payments error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch transactions",
            error: error.message
        });
    }
};