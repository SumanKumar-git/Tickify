import eventModel from "../models/event.model.js";
import bookingModel from "../models/booking.model.js";

import {
    createNotification
} from "./notification.service.js";

import {
    sendEmail
} from "./email.service.js";

import {
    eventReminderTemplate
} from "../templates/eventReminder.template.js";


const ONE_HOUR = 60 * 60 * 1000;

const send24HourInAppReminders = async () => {

    const now = new Date();

    const next24Hours = new Date(
        now.getTime() + 24 * ONE_HOUR
    );

    const events = await eventModel
        .find({
            status: "approved",

            startDate: {
                $gt: now,
                $lte: next24Hours
            }
        })
        .select("_id");


    if (events.length === 0) {
        return;
    }


    const eventIds = events.map(
        event => event._id
    );

    const bookings = await bookingModel
        .find({
            event: {
                $in: eventIds
            },

            bookingStatus: "confirmed",

            "reminders.inApp24hSentAt": null
        })
        .populate({
            path: "event",

            select:
                "title startDate venue"
        })
        .select(
            "user event reminders"
        );

    for (const booking of bookings) {

        try {

            await createNotification({
                user: booking.user,
                type: "event_reminder",
                title: "Your event starts tomorrow",
                message:
                    `${booking.event.title} starts within the next 24 hours. ` +
                    `Check your ticket and event details before heading to the venue.`,
                relatedEvent:
                    booking.event._id,
                relatedBooking:
                    booking._id
            });
            booking.reminders.inApp24hSentAt =
                new Date();

            await booking.save();

            console.log(
                `24-hour in-app reminder created for booking ${booking._id}`
            );

        } catch (error) {

            console.error(
                `Failed to create in-app reminder for booking ${booking._id}:`,
                error.message
            );
        }
    }
};

const send12HourEmailReminders = async () => {

    const now = new Date();

    const next12Hours = new Date(
        now.getTime() + 12 * ONE_HOUR
    );

    const events = await eventModel
        .find({
            status: "approved",
            startDate: {
                $gt: now,
                $lte: next12Hours
            }
        })
        .select("_id");

    if (events.length === 0) {
        return;
    }

    const eventIds = events.map(
        event => event._id
    );

    const bookings = await bookingModel
        .find({
            event: {
                $in: eventIds
            },
            bookingStatus: "confirmed",
            "reminders.email12hSentAt": null
        })
        .populate({
            path: "event",
            select:
                "title startDate venue"
        })
        .populate({
            path: "user",
            select:
                "fullName email"
        })
        .select(
            "user event quantity reminders"
        );

    for (const booking of bookings) {
        try {
            if (
                !booking.user?.email ||
                !booking.event
            ) {
                continue;
            }

            const eventDate =
                booking.event.startDate
                    .toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            timeZone:
                                "Asia/Kolkata"
                        }
                    );

            const eventTime =
                booking.event.startDate
                    .toLocaleTimeString(
                        "en-IN",
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                            timeZone:
                                "Asia/Kolkata"
                        }
                    );

            const html =
                eventReminderTemplate({
                    userName:
                        booking.user.fullName,
                    eventTitle:
                        booking.event.title,
                    eventDate,
                    eventTime,
                    venueName:
                        booking.event.venue?.name,
                    venueAddress:
                        booking.event.venue?.address,
                    city:
                        booking.event.venue?.city,
                    quantity:
                        booking.quantity
                });

            await sendEmail({
                to:
                    booking.user.email,
                subject:
                    `Reminder: ${booking.event.title} starts soon`,
                text:
                    `${booking.event.title} starts within the next 12 hours. ` +
                    `Date: ${eventDate}. ` +
                    `Time: ${eventTime}.`,
                html
            });

            booking.reminders.email12hSentAt =
                new Date();

            await booking.save();

            console.log(
                `12-hour email reminder sent for booking ${booking._id}`
            );

        } catch (error) {
            console.error(
                `Failed to send email reminder for booking ${booking._id}:`,
                error.message
            );
        }
    }
};


export const sendUpcomingEventReminders =
    async () => {

        await send24HourInAppReminders();

        await send12HourEmailReminders();
    };