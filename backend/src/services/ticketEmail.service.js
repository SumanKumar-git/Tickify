import QRCode from "qrcode";
import bookingModel from "../models/booking.model.js";
import { createTicketQrPayload } from "./ticketQr.service.js";
import { sendEmail } from "./email.service.js";
import { ticketEmailTemplate } from "../templates/ticketEmail.template.js";

/*
Generates QR codes and emails tickets to the user for a confirmed booking.
*/
export const sendTicketEmail = async (bookingId) => {
    try {
        // Fetch booking with populated user, event, and tickets
        const booking = await bookingModel.findById(bookingId)
            .populate("user")
            .populate("event")
            .populate("tickets");

        if (!booking) {
            console.error(`[TicketEmailService] Booking not found: ${bookingId}`);
            return;
        }

        if (booking.bookingStatus !== "confirmed") {
            console.warn(`[TicketEmailService] Booking status is not 'confirmed' for booking ${bookingId}: ${booking.bookingStatus}`);
            return;
        }

        if (!booking.tickets || booking.tickets.length === 0) {
            console.warn(`[TicketEmailService] No tickets generated for confirmed booking: ${bookingId}`);
            return;
        }

        const user = booking.user;
        const event = booking.event;

        if (!user || !user.email) {
            console.error(`[TicketEmailService] User or user email missing for booking ${bookingId}`);
            return;
        }

        if (!event) {
            console.error(`[TicketEmailService] Event details missing for booking ${bookingId}`);
            return;
        }

        // Format dates and venue address
        const eventDate = event.startDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone: "Asia/Kolkata"
        });

        const eventTime = event.startDate.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata"
        });

        const v = event.venue;
        const venueAddress = `${v.address}${v.city ? `, ${v.city}` : ""}${v.state ? `, ${v.state}` : ""}${v.country ? `, ${v.country}` : ""}`;

        const attachments = [];
        const ticketsWithCid = [];

        // Generate QR codes and attachments
        for (const ticket of booking.tickets) {
            const qrPayload = createTicketQrPayload({
                ticketNumber: ticket.ticketNumber,
                eventId: event._id
            });

            // Generate base64 QR code image
            const qrDataUrl = await QRCode.toDataURL(qrPayload, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 300
            });

            const base64Data = qrDataUrl.split("base64,")[1];
            const cid = `qrcode_${ticket._id}`;

            attachments.push({
                filename: `qrcode_${ticket.ticketNumber.slice(0, 8)}.png`,
                content: base64Data,
                encoding: "base64",
                cid: cid
            });

            ticketsWithCid.push({
                ticketNumber: ticket.ticketNumber,
                ticketSequence: ticket.ticketSequence,
                cid: cid
            });
        }

        // Generate email HTML
        const html = ticketEmailTemplate({
            userName: user.fullName,
            eventTitle: event.title,
            category: event.category,
            eventDate,
            eventTime,
            venueName: event.venue?.name,
            venueAddress,
            poster: event.poster,
            tickets: ticketsWithCid,
            totalTickets: booking.quantity
        });

        const text = `Hi ${user.fullName},\n\nYour booking for "${event.title}" has been confirmed! You have booked ${booking.quantity} ticket(s).\n\nVenue: ${event.venue?.name}\nDate: ${eventDate}\nTime: ${eventTime}\n\nYour ticket numbers are: ${booking.tickets.map(t => t.ticketNumber).join(", ")}\n\nPlease check your email for the QR code tickets.\n\nEnjoy the event!\nTeam Tickify`;

        // Send Email
        await sendEmail({
            to: user.email,
            subject: `Your Tickify Tickets: ${event.title}`,
            text,
            html,
            attachments
        });

        console.log(`[TicketEmailService] Tickets successfully sent for booking ${bookingId} to ${user.email}`);
    } catch (error) {
        console.error(`[TicketEmailService] Failed to send tickets email for booking ${bookingId}:`, error);
    }
};
