import notificationModel from "../models/notification.model.js";


export const createNotification =
    async ({
        user,
        type,
        title,
        message,
        relatedEvent = null,
        relatedBooking = null,
        relatedRefund = null,
        session = null
    }) => {

        const notificationData = {
            user,
            type,
            title,
            message,
            relatedEvent,
            relatedBooking,
            relatedRefund
        };


        if (session) {

            const [notification] =
                await notificationModel.create(
                    [notificationData],
                    {
                        session
                    }
                );

            return notification;
        }


        return await notificationModel.create(
            notificationData
        );
    };