import crypto from "crypto";

const createSignature = ({ ticketNumber, eventId }) => {
    return crypto
        .createHmac("sha256", process.env.TICKET_QR_SECRET)
        .update(`${ticketNumber}|${eventId}`)
        .digest("hex");
};

export const createTicketQrPayload = ({ ticketNumber, eventId }) => {

    const signature =
        createSignature({
            ticketNumber,
            eventId
        });

    return JSON.stringify({

        ticketNumber,
        eventId: eventId.toString(),
        signature
    });
};

export const verifyTicketQrPayload = (
    qrPayload
) => {

    let parsedPayload;

    try {
        parsedPayload =
            typeof qrPayload === "string"
                ? JSON.parse(qrPayload)
                : qrPayload;

    } catch {
        return {
            valid: false,
            reason:
                "Invalid QR code format"
        };
    }
    const {
        ticketNumber,
        eventId,
        signature
    } = parsedPayload;

    if (!ticketNumber || !eventId || !signature) {
        return {
            valid: false,
            reason: "Invalid QR code payload"
        };
    }

    const expectedSignature = createSignature({ticketNumber,eventId});

    const expectedBuffer = Buffer.from(expectedSignature,"hex");

    let receivedBuffer;

    try {

        receivedBuffer = Buffer.from(signature,"hex");

    } catch {
        return {
            valid: false,
            reason:"Invalid signature format"
        };
    }

    const valid = expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer,receivedBuffer);
    if (!valid) {
        return {
            valid: false,
            reason: "Invalid ticket signature"
        };
    }
    return {
        valid: true,
        ticketNumber,
        eventId
    };
};