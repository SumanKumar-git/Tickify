import crypto from "crypto";
import ticketModel from "../models/ticket.model.js";
import bookingModel from "../models/booking.model.js";

export const generateTicketsForBooking = async ({ booking, session }) => {

    const existingTickets =
        await ticketModel
            .find({
                booking: booking._id
            })
            .sort({
                ticketSequence: 1
            })
            .session(session);


    if (existingTickets.length > booking.quantity) {
        throw new Error(
            `Ticket count exceeds booking quantity for booking ${booking._id}`
        );
    }
    if (
        existingTickets.length ===
        booking.quantity
    ) {
        await bookingModel.updateOne(
            {
                _id: booking._id
            },
            {
                $set: {
                    tickets:existingTickets.map(ticket =>ticket._id)
                }
            },
            {
                session
            }
        );
        return existingTickets;
    }

    const existingSequences = new Set(existingTickets.map(ticket => ticket.ticketSequence));

    const missingSequences = [];

    for (let sequence = 1;sequence <= booking.quantity;sequence++) {
        if (!existingSequences.has(sequence)) {
            missingSequences.push(sequence);
        }
    }

    const ticketsToCreate =missingSequences.map(sequence =>({
                booking:booking._id,
                event:booking.event,
                user:booking.user,
                ticketSequence: sequence,
                ticketNumber:`TKT-${crypto.randomUUID()}`,
                ticketStatus: "active"
            })
        );

    let createdTickets = [];

    if (
        ticketsToCreate.length > 0
    ) {

        createdTickets =
            await ticketModel.insertMany(
                ticketsToCreate,
                {
                    session,
                    ordered: true
                }
            );
    }
    const allTickets = [
        ...existingTickets,
        ...createdTickets
    ].sort(
        (a, b) =>
            a.ticketSequence -
            b.ticketSequence
    );

    if (
        allTickets.length !==
        booking.quantity
    ) {

        throw new Error(
            `Ticket generation incomplete for booking ${booking._id}`
        );
    }


    await bookingModel.updateOne(
        {
            _id: booking._id
        },
        {
            $set: {
                tickets:
                    allTickets.map(
                        ticket =>
                            ticket._id
                    )
            }
        },
        {
            session
        }
    );

    return allTickets;
};