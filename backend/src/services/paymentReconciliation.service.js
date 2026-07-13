import mongoose from "mongoose";
import bookingModel from "../models/booking.model.js";
import paymentModel from "../models/payment.model.js";
import eventModel from "../models/event.model.js";
import { generateTicketsForBooking } from "./ticket.service.js";
import { sendTicketEmail } from "./ticketEmail.service.js";

import razorpayInstance from "../configs/razorpay.js";

const MAX_RECONCILIATION_ATTEMPTS = 3;


export const reconcileExpiredPayments = async () => {
    const now = new Date();

    const expiredPaymentBookings = await bookingModel
        .find({
            bookingStatus: "pending",
            paymentStatus: "initiated",
            paymentExpiresAt: {
                $lte: now
            },
            payment: {
                $ne: null
            }
        })
        .select("_id payment")
        .lean();

    for (const expiredBooking of expiredPaymentBookings) {
        try {
            const paymentRecord = await paymentModel.findById(
                expiredBooking.payment
            );
            if (!paymentRecord) {
                console.error(
                    `Payment record missing for booking ${expiredBooking._id}`
                );
                continue;
            }
            const razorpayPayments =
                await razorpayInstance.orders.fetchPayments(
                    paymentRecord.gatewayOrderId
                );

            const payments =
                razorpayPayments.items || [];

            /*
            ---------------------------------
            1. CHECK CAPTURED PAYMENT
            ---------------------------------
            */

            const capturedPayment = payments.find(
                (payment) =>
                    payment.status === "captured"
            );

            if (capturedPayment) {
                await confirmReconciledPayment({
                    bookingId:
                        expiredBooking._id,
                    paymentRecordId:
                        paymentRecord._id,
                    razorpayPayment:
                        capturedPayment
                });
                continue;
            }

            /*
            ---------------------------------
            2. CHECK AUTHORIZED PAYMENT
            ---------------------------------
            */

            const authorizedPayment = payments.find(
                (payment) =>
                    payment.status === "authorized"
            );

            if (authorizedPayment) {

                console.log(
                    `Payment ${authorizedPayment.id} is authorized but not captured`
                );
                continue;
            }

            /*
            ---------------------------------
            3. CHECK EXPLICIT FAILED PAYMENT
            ---------------------------------
            */

            const failedPayment = payments.find(
                (payment) =>
                    payment.status === "failed"
            );

            if (failedPayment) {
                await failReconciledPayment({
                    bookingId:
                        expiredBooking._id,
                    paymentRecordId:
                        paymentRecord._id,
                    razorpayPayments:
                        payments
                });
                continue;
            }

            /*
            ---------------------------------
            4. NO PAYMENT FOUND

            Retry reconciliation instead of
            immediately cancelling booking.
            ---------------------------------
            */
            if (payments.length === 0) {

                const updatedPayment =
                    await paymentModel.findOneAndUpdate(
                        {
                            _id: paymentRecord._id,
                            paymentStatus:
                                "pending"
                        },
                        {
                            $inc: {
                                reconciliationAttempts: 1
                            }
                        },
                        {
                            new: true
                        }
                    );


                if (!updatedPayment) {
                    continue;
                }

                if (
                    updatedPayment.reconciliationAttempts >=
                    MAX_RECONCILIATION_ATTEMPTS
                ) {
                    await failReconciledPayment({
                        bookingId:
                            expiredBooking._id,
                        paymentRecordId:
                            paymentRecord._id,
                        razorpayPayments:
                            payments
                    });
                }

                continue;
            }

            /*
            ---------------------------------
            5. UNKNOWN PAYMENT STATE

            Do nothing destructive.
            Log and retry on next cron run.
            ---------------------------------
            */

            console.warn(
                `Unknown Razorpay payment state for booking ${expiredBooking._id}`,
                payments.map(
                    (payment) => payment.status
                )
            );

        } catch (error) {

            /*
            Razorpay API failure must NOT
            cancel booking or restore seats.
            */
            console.error(
                `Failed to reconcile booking ${expiredBooking._id}:`,
                error
            );
        }
    }
};

const confirmReconciledPayment = async ({
    bookingId,
    paymentRecordId,
    razorpayPayment
}) => {

    const session = await mongoose.startSession();
    let confirmedBookingId = null;

    try {

        await session.withTransaction(async () => {


            // ----------------------------------
            // Claim and confirm Booking
            // ----------------------------------

            const confirmedBooking =
                await bookingModel.findOneAndUpdate(
                    {
                        _id: bookingId,

                        bookingStatus: "pending",

                        paymentStatus: "initiated",

                        payment: paymentRecordId
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
                return;
            }

            confirmedBookingId = confirmedBooking._id;

            const updatedPayment =
                await paymentModel.findOneAndUpdate(
                    {
                        _id: paymentRecordId,
                        booking: bookingId,
                        paymentStatus: "pending"
                    },
                    {
                        $set: {
                            paymentStatus: "success",
                            gatewayPaymentId: razorpayPayment.id,
                            paidAt: new Date(
                                razorpayPayment.created_at * 1000
                            ),
                            reconciliationAttempts: 0
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );


            if (!updatedPayment) {

                throw new Error(
                    `Unable to update payment ${paymentRecordId}`
                );
            }

            await generateTicketsForBooking({
                booking: confirmedBooking,
                session
            });

        });

        if (confirmedBookingId) {
            sendTicketEmail(confirmedBookingId).catch(err =>
                console.error("[confirmReconciledPayment] Error sending ticket email:", err)
            );
        }

    } finally {

        await session.endSession();
    }
};

const failReconciledPayment = async ({
    bookingId,
    paymentRecordId,
    razorpayPayments
}) => {

    const session = await mongoose.startSession();

    try {

        await session.withTransaction(async () => {

            /*
            Atomically claim stale initiated booking.
            */

            const booking =
                await bookingModel.findOneAndUpdate(
                    {
                        _id: bookingId,
                        bookingStatus: "pending",
                        paymentStatus: "initiated",
                        payment: paymentRecordId,
                        paymentExpiresAt: {
                            $lte: new Date()
                        }
                    },
                    {
                        $set: {
                            bookingStatus: "cancelled",
                            paymentStatus: "failed",
                            paymentExpiresAt: null,
                            reservationExpiresAt: null
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

            /*
            Already handled by verification,
            webhook, or another reconciliation.
            */
            if (!booking) {
                return;
            }

            const failedPayment = razorpayPayments.find(
                (payment) =>
                    payment.status === "failed"
            );

            await paymentModel.updateOne(
                {
                    _id: paymentRecordId,
                    paymentStatus: "pending"
                },
                {
                    $set: {
                        paymentStatus: "failed",
                        failureReason:
                            failedPayment?.error_description ||
                            "Payment window expired"
                    }
                },
                {
                    session
                }
            );

            /*
            Restore reserved seats.
            */

            await eventModel.updateOne(
                {
                    _id: booking.event
                },
                {
                    $inc: {
                        availableSeats:
                            booking.quantity
                    }
                },
                {
                    session
                }
            );
        });

    } finally {

        await session.endSession();
    }
};