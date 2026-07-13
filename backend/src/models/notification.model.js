import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true
        },

        type: {
            type: String,
            enum: [
                "event_approved",
                "event_rejected",
                "booking_confirmed",
                "booking_cancelled",
                "refund_pending",
                "refund_completed",
                "event_cancelled",
                "event_reminder",
                "general"
            ],
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        isRead: {
            type: Boolean,
            default: false
        },

        relatedEvent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "event",
            default: null
        },

        relatedBooking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "booking",
            default: null
        },

        relatedRefund: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "refund",
            default: null
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({
    user: 1,
    isRead: 1,
    createdAt: -1
});

const notificationModel = mongoose.model("notification", notificationSchema);

export default notificationModel;