import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "booking",
        required: [true, "Booking is required"],
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "User is required"],
        index: true
    },
    currency: {
        type: String,
        required: [true, "Currency is required"],
        default: "INR"
    },
    paymentGateway: {
        type: String,
        enum: ["stripe", "razorpay"],
        required: [true, "Payment gateway is required"],
        default: "stripe"
    },
    gatewayOrderId: {
        type: String,
        unique: true,
        sparse: true
    },
    gatewayPaymentId: {
        type: String,
        unique: true,
        sparse: true
    },
    gatewaySignature: {
        type: String,
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount can't be negative"]
    },
    paymentStatus: {
        type: String,
        required: [true, "Payment status is required"],
        enum: ["pending", "success", "failed", "refunded"],
        default: "pending"
    },
    paymentMethod: {
        type: String
    },
    bank: {
        type: String
    },
    wallet: {
        type: String
    },
    vpa: {
        type: String
    },
    fee: {
        type: Number
    },
    tax: {
        type: Number
    },
    reconciliationAttempts: {
        type: Number,
        default: 0,
        min: 0
    },
    paidAt: {
        type: Date
    },
    failureReason: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});


paymentSchema.index({
    paymentStatus: 1,
});

const paymentModel = mongoose.model("payment", paymentSchema);
export default paymentModel;