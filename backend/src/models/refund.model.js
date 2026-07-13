import mongoose from "mongoose";

const refundSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "booking",
        required: [true, "Booking is required"],
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "User is required"],
        index: true
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "payment",
        required: [true, "Payment is required"],
        index: true
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount can't be negative"]
    },
    refundStatus: {
        type: String,
        enum: ["pending", "failed", "refunded"],
        default: "pending"
    },
    reason: {
        type: String,
        trim: true
    },
    processedAt: {
        type: Date
    },
    failureReason: {
        type: String,
        trim: true
    },
    gatewayRefundId: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true
});


refundSchema.index({
    refundStatus: 1,
});

const refundModel = mongoose.model("refund", refundSchema);
export default refundModel;