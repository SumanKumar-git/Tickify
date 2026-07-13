import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        maxlength: [120, "Title should not exceed 120 characters"]
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        maxlength: [500, "Description should not exceed 500 characters"]
    },
    venue: {
        name: {
            type: String,
            required: [true, "Venue name is required"],
            trim: true
        },

        address: {
            type: String,
            required: [true, "Address is required"],
            trim: true
        },

        city: {
            type: String,
            required: [true, "City is required"],
            trim: true
        },

        state: {
            type: String,
            required: [true, "State is required"],
            trim: true
        },

        country: {
            type: String,
            required: [true, "Country is required"],
            trim: true
        }
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        enum: ["Music", "Art", "Workshop", "Seminar", "Conference", "Comedy"],
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, "Start date is required"]
    },
    endDate: {
        type: Date,
        required: [true, "End date is required"]
    },
    poster: {
        type: String,
        required: [true, "Poster is required"]
    },
    posterPublicId: {
        type: String
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "Organizer is required"]
    },
    totalSeats: {
        type: Number,
        required: [true, "Total seats is required"],
        min: [1, "Total seats must be at least 1"]
    },
    availableSeats: {
        type: Number,
        min: [0, "Available seats can't be negative"]
    },
    ticketPrice: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price can't be negative"]
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "cancelled", "completed"],
        default: "pending"
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    approvedAt: {
        type: Date
    },
    rejectedAt: {
        type: Date
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    reviewRemark: {
        type: String,
        trim: true,
        maxlength: [500, "Review remark should not exceed 500 characters"]
    }
}, {
    timestamps: true
});

eventSchema.pre("save", function () {
    if (this.isNew) {
    this.availableSeats = this.totalSeats;
    }
});

eventSchema.virtual("soldSeats").get(function () {
    return this.totalSeats - this.availableSeats;
});

eventSchema.index({
    title: "text",
    description: "text"
})

const eventModel = mongoose.model("event", eventSchema);
export default eventModel;