import { z } from "zod";

export const createBookingSchema = z.object({
    eventId: z
        .string()
        .min(1, "Event ID is required")
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid event ID"),

    quantity: z.coerce
    .number()
    .int("Quantity must be an integer")
    .min(1, "At least one ticket must be booked")
    .max(10, "You can book a maximum of 10 tickets at once")
});