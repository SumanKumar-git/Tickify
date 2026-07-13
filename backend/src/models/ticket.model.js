import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "booking",
        required: [true, "Booking is required"]
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "event",
        required: [true, "Event is required"]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "User is required"]
    },
    ticketNumber: {
        type: String,
        required: [true, "Ticket number is required"],
        unique: true
    },
    ticketSequence: {
        type: Number,
        required: [true, "Ticket sequence is required"],
        min: [1, "Ticket sequence must be at least 1"]
    },
    ticketStatus: {
        type: String,
        enum: ["active", "used", "cancelled"],
        default: "active"
    },
    checkedInAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

ticketSchema.index(
    {
        booking: 1,
        ticketSequence: 1
    },
    {
        unique: true
    }
);

ticketSchema.index({
    event: 1,
    ticketStatus: 1,
});

ticketSchema.index({
    user: 1,
});

const ticketModel = mongoose.model("ticket", ticketSchema);
export default ticketModel;