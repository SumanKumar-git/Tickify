import { z } from "zod"

export const eventSchema = z.object({
    title: z.string().min(1, "Title is required").max(120, "Title should not exceed 120 characters"),
    description: z.string().min(1, "Description is required").max(500, "Description should not exceed 500 characters"),
    category: z.enum(["Music", "Art", "Workshop", "Seminar", "Conference", "Comedy"], {
        errorMap: () => ({ message: "Invalid category" })
    }),
    venue: z.object({
        name: z.string().trim().min(1, "Venue name is required").max(100, "Venue name should not exceed 100 characters"),
        address: z.string().trim().min(1, "Address is required").max(200, "Address should not exceed 200 characters"),
        city: z.string().trim().min(1, "City is required"),
        state: z.string().trim().min(1, "State is required"),
        country: z.string().trim().min(1, "Country is required")
    }),
    startDate: z.string().transform((val) => new Date(val)),
    endDate: z.string().transform((val) => new Date(val)),
    totalSeats: z.coerce.number().min(1, "Total seats must be at least 1"),
    ticketPrice: z.coerce.number().min(0, "Price can't be negative"),
    status: z.enum(["pending", "approved", "rejected", "cancelled", "completed"], {
        errorMap: () => ({ message: "Invalid status" })
    }).default("pending")
});

export const updateEventSchema = z.object({
    title: z
        .string()
        .min(1, "Title is required")
        .max(120, "Title should not exceed 120 characters")
        .optional(),

    description: z
        .string()
        .min(1, "Description is required")
        .max(500, "Description should not exceed 500 characters")
        .optional(),

    venue: z.object({
        name: z.string().min(1).optional(),
        address: z.string().min(1).optional(),
        city: z.string().min(1).optional(),
        state: z.string().min(1).optional(),
        country: z.string().min(1).optional()
    }).optional(),

    category: z.enum([
        "Music",
        "Art",
        "Workshop",
        "Seminar",
        "Conference",
        "Comedy"
    ]).optional(),

    startDate: z.coerce.date().optional(),

    endDate: z.coerce.date().optional(),

    totalSeats: z.coerce
        .number()
        .int()
        .min(1)
        .optional(),

    ticketPrice: z.coerce
        .number()
        .min(0)
        .optional()
});