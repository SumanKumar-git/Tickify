export const eventReminderTemplate = ({
    userName,
    eventTitle,
    eventDate,
    eventTime,
    venueName,
    venueAddress,
    city,
    quantity
}) => {

    const safeUserName = userName || "Guest";
    const safeEventTitle = eventTitle || "Your Event";
    const safeVenueName = venueName || "Event Venue";
    const safeVenueAddress = venueAddress || "";
    const safeCity = city || "";

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            />

            <title>Event Reminder</title>
        </head>

        <body
            style="
                margin: 0;
                padding: 0;
                background-color: #f4f4f5;
                font-family: Arial, Helvetica, sans-serif;
                color: #18181b;
            "
        >

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
            >
                <tr>
                    <td
                        align="center"
                        style="padding: 40px 16px;"
                    >

                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="
                                max-width: 600px;
                                background-color: #ffffff;
                                border-radius: 12px;
                                overflow: hidden;
                                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                            "
                        >

                            <!-- HEADER -->

                            <tr>
                                <td
                                    style="
                                        background-color: #18181b;
                                        padding: 28px 32px;
                                        text-align: center;
                                    "
                                >
                                    <h1
                                        style="
                                            margin: 0;
                                            color: #ffffff;
                                            font-size: 28px;
                                        "
                                    >
                                        Tickify
                                    </h1>

                                    <p
                                        style="
                                            margin: 8px 0 0;
                                            color: #d4d4d8;
                                            font-size: 14px;
                                        "
                                    >
                                        Your event is almost here
                                    </p>
                                </td>
                            </tr>


                            <!-- CONTENT -->

                            <tr>
                                <td
                                    style="
                                        padding: 32px;
                                    "
                                >

                                    <p
                                        style="
                                            margin-top: 0;
                                            font-size: 16px;
                                            line-height: 1.6;
                                        "
                                    >
                                        Hi ${safeUserName},
                                    </p>


                                    <p
                                        style="
                                            font-size: 16px;
                                            line-height: 1.6;
                                        "
                                    >
                                        This is a reminder that
                                        <strong>${safeEventTitle}</strong>
                                        starts in approximately
                                        <strong>12 hours</strong>.
                                    </p>


                                    <!-- EVENT DETAILS -->

                                    <table
                                        width="100%"
                                        cellpadding="0"
                                        cellspacing="0"
                                        role="presentation"
                                        style="
                                            margin: 24px 0;
                                            background-color: #fafafa;
                                            border: 1px solid #e4e4e7;
                                            border-radius: 8px;
                                        "
                                    >

                                        <tr>
                                            <td
                                                style="
                                                    padding: 20px;
                                                "
                                            >

                                                <h2
                                                    style="
                                                        margin: 0 0 18px;
                                                        font-size: 20px;
                                                    "
                                                >
                                                    ${safeEventTitle}
                                                </h2>


                                                <p
                                                    style="
                                                        margin: 8px 0;
                                                        font-size: 15px;
                                                    "
                                                >
                                                    <strong>Date:</strong>
                                                    ${eventDate}
                                                </p>


                                                <p
                                                    style="
                                                        margin: 8px 0;
                                                        font-size: 15px;
                                                    "
                                                >
                                                    <strong>Time:</strong>
                                                    ${eventTime}
                                                </p>


                                                <p
                                                    style="
                                                        margin: 8px 0;
                                                        font-size: 15px;
                                                    "
                                                >
                                                    <strong>Venue:</strong>
                                                    ${safeVenueName}
                                                </p>


                                                <p
                                                    style="
                                                        margin: 8px 0;
                                                        font-size: 15px;
                                                    "
                                                >
                                                    <strong>Location:</strong>
                                                    ${safeVenueAddress}${safeVenueAddress && safeCity ? ", " : ""}${safeCity}
                                                </p>


                                                <p
                                                    style="
                                                        margin: 8px 0;
                                                        font-size: 15px;
                                                    "
                                                >
                                                    <strong>Tickets:</strong>
                                                    ${quantity}
                                                </p>

                                            </td>
                                        </tr>

                                    </table>


                                    <p
                                        style="
                                            font-size: 15px;
                                            line-height: 1.6;
                                            color: #52525b;
                                        "
                                    >
                                        Please arrive at the venue early and
                                        keep your digital ticket ready for
                                        check-in.
                                    </p>


                                    <p
                                        style="
                                            margin-bottom: 0;
                                            font-size: 16px;
                                            line-height: 1.6;
                                        "
                                    >
                                        See you there!<br />
                                        <strong>Team Tickify</strong>
                                    </p>

                                </td>
                            </tr>


                            <!-- FOOTER -->

                            <tr>
                                <td
                                    style="
                                        padding: 20px 32px;
                                        text-align: center;
                                        background-color: #fafafa;
                                        border-top: 1px solid #e4e4e7;
                                    "
                                >

                                    <p
                                        style="
                                            margin: 0;
                                            color: #71717a;
                                            font-size: 12px;
                                            line-height: 1.5;
                                        "
                                    >
                                        This email was sent because you have
                                        a confirmed booking for this event.
                                    </p>

                                </td>
                            </tr>

                        </table>

                    </td>
                </tr>
            </table>

        </body>
        </html>
    `;
};