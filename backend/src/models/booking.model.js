import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "User is required"]
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "event",
        required: [true, "Event is required"]
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity must be at least 1"]
    },
    totalAmount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount can't be negative"]
    },
    bookingStatus: {
        type: String,
        enum: ["pending", "confirmed", "cancelled"],
        default: "pending"
    },
    tickets: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ticket"
        }
    ],
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "payment",
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ["not_started", "initiated", "success", "failed", "refunded"],
        default: "not_started"
    },
    paymentExpiresAt: {
        type: Date,
        default: null
    },
    confirmedAt: {
        type: Date
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    reservationExpiresAt: {
        type: Date,
        default: null
    },
    reminders: {
        inApp24hSentAt: {
            type: Date,
            default: null
        },

        email12hSentAt: {
            type: Date,
            default: null
        }
    },
}, {
    timestamps: true
});

bookingSchema.index({
    user: 1,
    createdAt: -1,
});

bookingSchema.index({
    event: 1,
});

bookingSchema.index({
    bookingStatus: 1,
});

bookingSchema.index({
    bookingStatus: 1,
    paymentStatus: 1,
    reservationExpiresAt: 1
});

bookingSchema.index({
    bookingStatus: 1,
    paymentStatus: 1,
    paymentExpiresAt: 1
});

bookingSchema.index({
    paymentStatus: 1,
});

bookingSchema.virtual("ticketCount").get(function () {
    return this.quantity;
});

const bookingModel = mongoose.model("booking", bookingSchema);
export default bookingModel;
