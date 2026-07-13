import mongoose from "mongoose";
import bookingModel from "../models/booking.model.js";
import eventModel from "../models/event.model.js";

export const releaseExpiredReservation = async () => {
    const now = new Date();

    const expiredBookings = await bookingModel.find({
        bookingStatus: "pending",
        paymentStatus: "not_started",
        reservationExpiresAt: { $lte: now }
    }).select("_id").lean();

    for (const expiredBooking of expiredBookings){
        const session = await mongoose.startSession();
        try{
            await session.withTransaction(async () => {
                const booking = await bookingModel.findOneAndUpdate({
                    _id: expiredBooking._id,
                    bookingStatus: "pending",
                    paymentStatus: "not_started",
                    reservationExpiresAt: { $lte : new Date() }
                },{
                    $set: {
                        bookingStatus: "cancelled",
                        reservationExpiresAt: null
                    }
                },{
                    new : true,
                    session
                });

                if(!booking){
                    return;
                }

                await eventModel.updateOne({
                    _id: booking.event
                },{
                    $inc : {
                        availableSeats: booking.quantity
                    }
                }, {
                    session
                })
            });
        }
        catch(error){
            console.log(`Failed to release booking ${expiredBooking._id}: `, error)
        }finally{
            await session.endSession();
        }
    }
};