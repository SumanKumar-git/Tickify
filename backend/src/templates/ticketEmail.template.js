export const ticketEmailTemplate = ({
    userName,
    eventTitle,
    category,
    eventDate,
    eventTime,
    venueName,
    venueAddress,
    poster,
    tickets,
    totalTickets
}) => {
    const safeUserName = userName || "Guest";
    const safeEventTitle = eventTitle || "Your Event";
    const safeCategory = category || "Event";
    const safeVenueName = venueName || "Event Venue";
    const safeVenueAddress = venueAddress || "";
    const safePoster = poster || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=600&q=80";

    const ticketsHtml = tickets.map((ticket) => {
        const displayTicketNumber = ticket.ticketNumber.length > 20
            ? `${ticket.ticketNumber.slice(0, 8)}...${ticket.ticketNumber.slice(-6)}`
            : ticket.ticketNumber;

        return `
            <!-- TICKET CARD -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff; overflow: hidden; max-width: 580px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                <tr>
                    <!-- LEFT COLUMN: Event Poster -->
                    <td width="140" valign="top" style="padding: 0; margin: 0; width: 140px; border-top-left-radius: 11px; border-bottom-left-radius: 11px; overflow: hidden;">
                        <img src="${safePoster}" width="140" height="190" alt="Event Poster" style="display: block; width: 140px; height: 190px; object-fit: cover; border-top-left-radius: 11px; border-bottom-left-radius: 11px; border: 0;" />
                    </td>

                    <!-- MIDDLE COLUMN: Ticket Details -->
                    <td valign="top" style="padding: 16px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: left;">
                        <!-- Category Tag -->
                        <span style="display: inline-block; background-color: #f4f4f5; color: #71717a; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                            ${safeCategory}
                        </span>

                        <!-- Event Title -->
                        <h3 style="margin: 8px 0 6px 0; font-size: 16px; font-weight: 700; color: #18181b; line-height: 1.3;">
                            ${safeEventTitle}
                        </h3>

                        <!-- Date & Time -->
                        <p style="margin: 0 0 4px 0; font-size: 13px; color: #52525b; line-height: 1.4;">
                            <strong>Date:</strong> ${eventDate}
                        </p>
                        <p style="margin: 0 0 4px 0; font-size: 13px; color: #52525b; line-height: 1.4;">
                            <strong>Time:</strong> ${eventTime}
                        </p>

                        <!-- Venue -->
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #52525b; line-height: 1.4;">
                            <strong>Venue:</strong> ${safeVenueName}
                        </p>

                        <!-- Divider -->
                        <div style="border-top: 1px dashed #e4e4e7; margin: 12px 0 10px 0; height: 1px; line-height: 1px; font-size: 1px;">&nbsp;</div>

                        <!-- Attendee Info & Sequence -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                            <tr>
                                <td valign="top">
                                    <span style="font-size: 9px; color: #a1a1aa; text-transform: uppercase; font-weight: 700; display: block; letter-spacing: 0.5px;">
                                        Attendee
                                    </span>
                                    <span style="font-size: 13px; color: #18181b; font-weight: 600;">
                                        ${safeUserName}
                                    </span>
                                </td>
                                <td valign="top" align="right">
                                    <span style="font-size: 9px; color: #a1a1aa; text-transform: uppercase; font-weight: 700; display: block; letter-spacing: 0.5px;">
                                        Ticket
                                    </span>
                                    <span style="font-size: 13px; color: #4f46e5; font-weight: 700;">
                                        ${ticket.ticketSequence} of ${totalTickets}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </td>

                    <!-- DASHED SEPARATOR COLUMN (stub separator) -->
                    <td width="1" style="width: 1px; border-left: 2px dashed #e4e4e7; padding: 0; margin: 0;">
                        <!-- Vertical perforation -->
                    </td>

                    <!-- RIGHT COLUMN: QR Code Stub -->
                    <td width="130" valign="middle" align="center" style="padding: 16px 12px; background-color: #fafafa; border-top-right-radius: 11px; border-bottom-right-radius: 11px; width: 130px; text-align: center;">
                        <img src="cid:${ticket.cid}" width="96" height="96" alt="Ticket QR Code" style="display: block; width: 96px; height: 96px; margin: 0 auto 8px auto; border: 0; image-rendering: pixelated;" />
                        <span style="font-size: 10px; font-family: 'Courier New', Courier, monospace; color: #71717a; display: block; letter-spacing: 0.5px; word-break: break-all; max-width: 110px;">
                            ${displayTicketNumber}
                        </span>
                    </td>
                </tr>
            </table>
        `;
    }).join("");

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Your Tickets - Tickify</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f4f4f5; width: 100%;">
                <tr>
                    <td align="center" style="padding: 40px 16px;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                            
                            <!-- HEADER -->
                            <tr>
                                <td align="center" style="background: linear-gradient(135deg, #18181b, #27272a); padding: 32px 24px; text-align: center;">
                                    <div style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                        🎟 Tickify
                                    </div>
                                    <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px; font-weight: 500;">
                                        Booking Confirmed & Tickets Ready!
                                    </p>
                                </td>
                            </tr>

                            <!-- CONTENT -->
                            <tr>
                                <td style="padding: 32px 24px;">
                                    <p style="margin-top: 0; margin-bottom: 12px; font-size: 16px; line-height: 1.6; color: #18181b;">
                                        Hi <strong>${safeUserName}</strong>,
                                    </p>
                                    <p style="margin-top: 0; margin-bottom: 24px; font-size: 15px; line-height: 1.6; color: #3f3f46;">
                                        Your booking for <strong>${safeEventTitle}</strong> has been confirmed successfully! 
                                        Below are your official entry tickets. Please present the QR codes at the check-in counter at the venue.
                                    </p>

                                    <!-- TICKETS CONTAINER -->
                                    <div style="margin: 24px 0;">
                                        ${ticketsHtml}
                                    </div>

                                    <!-- VENUE DETAILS -->
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 28px; background-color: #fafafa; border: 1px dashed #e4e4e7; border-radius: 12px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                        <tr>
                                            <td style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: left;">
                                                <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #18181b; text-transform: uppercase; letter-spacing: 0.5px;">
                                                    Venue & Location Details
                                                </h4>
                                                <p style="margin: 0 0 4px 0; font-size: 14px; color: #3f3f46;">
                                                    <strong>${safeVenueName}</strong>
                                                </p>
                                                <p style="margin: 0; font-size: 13px; color: #71717a; line-height: 1.5;">
                                                    ${safeVenueAddress}
                                                </p>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- IMPORTANT NOTES -->
                                    <div style="margin-top: 28px; padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
                                        <h5 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #1e3a8a; text-transform: uppercase;">
                                            Important Instructions
                                        </h5>
                                        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e40af; line-height: 1.6;">
                                            <li>Do not share these QR codes with anyone, as they can only be scanned once.</li>
                                            <li>Please arrive at the venue at least 15-30 minutes before the start time.</li>
                                            <li>Keep this email handy on your phone for a quick entry scan.</li>
                                        </ul>
                                    </div>

                                    <p style="margin-top: 32px; margin-bottom: 0; font-size: 15px; line-height: 1.6; color: #18181b;">
                                        Have a fantastic time at the event!<br />
                                        <strong>Team Tickify</strong>
                                    </p>
                                </td>
                            </tr>

                            <!-- FOOTER -->
                            <tr>
                                <td style="padding: 24px; text-align: center; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
                                    <p style="margin: 0; color: #71717a; font-size: 12px; line-height: 1.6;">
                                        This is a confirmation email for your transaction on Tickify. 
                                        For any support, please contact organizer details shown on the event details page.
                                    </p>
                                    <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 12px;">
                                        &copy; 2026 Tickify. All rights reserved.
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
