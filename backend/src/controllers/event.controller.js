import eventModel from "../models/event.model.js";
import userModel from "../models/user.model.js";
import { createNotification } from "../services/notification.service.js";
import { eventSchema, updateEventSchema } from "../validations/event.validation.js";
import cloudinary from "../services/cloudinary.service.js";
import { deleteLocalFile } from "../utils/fileCleanup.js";

//Controller for creating event by organizer
export const createEvent = async (req, res) => {
    try {
        const data = {...req.body, venue: JSON.parse(req.body.venue)};
        const validatedData = eventSchema.parse(data);
        const {title, description, venue, category, startDate, endDate, totalSeats, ticketPrice} = validatedData;
        const poster = req.file;

        const user = await userModel.findById(req.user._id);

        if(user.role !== "organizer"){
            return res.status(403).json(
                {
                    success: false,
                    message: "Only organizers can create events"
                }
            );
        }

        if(new Date(startDate) < new Date()){
            return res.status(400).json(
                {
                    success: false,
                    message: "Start date must be after current date"
                }
            );
        }

        if(new Date(endDate) < new Date(startDate)){
            return res.status(400).json(
                {
                    success: false,
                    message: "End date must be after start date"
                }
            );
        }

        if(!poster){
            return res.status(400).json(
                {
                    success: false,
                    message: "Please upload poster"
                }
            );
        }
        let posterUrl = null;
        let posterPublicId = null;

        const posterUpload = await cloudinary.uploader.upload(poster.path, {
            folder: "tickify/events/posters",
            resource_type: "image"
        });
        posterUrl = posterUpload.secure_url;
        posterPublicId = posterUpload.public_id;


        const event = await eventModel.create({
            title,
            description,
            venue,
            category,
            startDate,
            endDate,
            totalSeats,
            ticketPrice,
            poster: posterUrl,
            posterPublicId,
            organizer: user._id
        });

        return res.status(201).json({
            success: true,
            message: "Event created successfully",
            event
        });

    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to create event",
            error: err.message
        });
    }
    finally {
        if (req.file?.path) {
            await deleteLocalFile(req.file.path);
        }
    }
};

//Controller for updating an event by organizer
// export const updateEvent = async (req, res) => {
//     try{
//         if(req.body.venue){
//             req.body.venue = JSON.parse(req.body.venue);
//         }

//         const validatedData = updateEventSchema.parse(req.body);
//         const {title, description, venue, category, startDate, endDate, totalSeats, ticketPrice} = validatedData;
//         const poster = req.file;

//         const event = await eventModel.findById(req.params.id);
//         if(!event){
//             return res.status(404).json(
//                 {
//                     success: false,
//                     message: "Event not found"
//                 }
//             );
//         }

//         if(event.organizer.toString() !== req.user._id.toString()){
//             return res.status(403).json(
//                 {
//                     success: false,
//                     message: "Only organizer can update event"
//                 }
//             );
//         }

//         if(event.status === "approved"){
//             return res.status(400).json(
//                 {
//                     success: false,
//                     message: "Approved event cannot be updated"
//                 }
//             );
//         }

//         if (
//             event.status === "cancelled" ||
//             event.status === "completed"
//         ) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Event cannot be modified"
//             });
//         }

//         const finalStartDate =
//             startDate
//             ? new Date(startDate)
//             : new Date(event.startDate);

//         const finalEndDate =
//             endDate
//             ? new Date(endDate)
//             : new Date(event.endDate);

//         if (finalStartDate < new Date()) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Start date must be after current date"
//             });
//         }

//         if (finalEndDate < finalStartDate) {
//             return res.status(400).json({
//                 success: false,
//                 message: "End date must be after start date"
//             });
//         }


//         if(event.status === "rejected"){
//             event.status = "pending";
//         }

//         if(venue){
//             event.venue = {
//                 ...event.venue?.toObject(),
//                 ...venue
//             }
//         }

//         if(poster){
//             if(event.posterPublicId){
//                 await cloudinary.uploader.destroy(event.posterPublicId);
//             }
//             const posterUpload = await cloudinary.uploader.upload(poster.path, {
//                 folder: "tickify/events/posters",
//                 resource_type: "image"
//             });
//             event.poster = posterUpload.secure_url;
//             event.posterPublicId = posterUpload.public_id;
//         }

//         event.title = title ?? event.title;
//         event.description = description ?? event.description;
//         event.category = category ?? event.category;
//         event.startDate = startDate ?? event.startDate;
//         event.endDate = endDate ?? event.endDate;
//         event.totalSeats = totalSeats ?? event.totalSeats;
//         event.ticketPrice = ticketPrice ?? event.ticketPrice;
//         event.availableSeats = totalSeats ?? event.availableSeats;
//         await event.save();

//         return res.status(200).json({
//             success: true,
//             message: "Event updated successfully",
//             event
//         });
//     }
//     catch(err){
//         return res.status(500).json({
//             success: false,
//             message: "Failed to update event",
//             error: err.message
//         });
//     }
// }
export const updateEvent = async (req, res) => {

    let oldPosterPublicId = null;
    let newPosterPublicId = null;

    try {

        if (req.body.venue) {
            req.body.venue =
                JSON.parse(req.body.venue);
        }

        const validatedData =
            updateEventSchema.parse(req.body);

        const {
            title,
            description,
            venue,
            category,
            startDate,
            endDate,
            totalSeats,
            ticketPrice
        } = validatedData;

        const poster = req.file;

        const event = await eventModel.findById(
            req.params.id
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        if (
            event.organizer.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Only organizer can update event"
            });
        }

        if (event.status === "approved") {
            return res.status(400).json({
                success: false,
                message: "Approved event cannot be updated"
            });
        }

        if (
            event.status === "cancelled" ||
            event.status === "completed"
        ) {
            return res.status(400).json({
                success: false,
                message: "Event cannot be modified"
            });
        }

        const finalStartDate = startDate
            ? new Date(startDate)
            : new Date(event.startDate);

        const finalEndDate = endDate
            ? new Date(endDate)
            : new Date(event.endDate);

        if (finalStartDate < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Start date must be after current date"
            });
        }

        if (finalEndDate < finalStartDate) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date"
            });
        }

        if (event.status === "rejected") {
            event.status = "pending";
        }

        if (venue) {
            event.venue = {
                ...event.venue?.toObject(),
                ...venue
            };
        }


        if (poster) {

            oldPosterPublicId =
                event.posterPublicId;


            const posterUpload =
                await cloudinary.uploader.upload(
                    poster.path,
                    {
                        folder:
                            "tickify/events/posters",
                        resource_type: "image"
                    }
                );

            event.poster =
                posterUpload.secure_url;
            event.posterPublicId =
                posterUpload.public_id;
            newPosterPublicId =
                posterUpload.public_id;
        }

        event.title =
            title ?? event.title;
        event.description =
            description ?? event.description;
        event.category =
            category ?? event.category;
        event.startDate =
            startDate ?? event.startDate;
        event.endDate =
            endDate ?? event.endDate;
        event.ticketPrice =
            ticketPrice ?? event.ticketPrice;

        if (totalSeats !== undefined) {

            const soldSeats =
                event.totalSeats -
                event.availableSeats;

            if (totalSeats < soldSeats) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Total seats cannot be less than already sold seats (${soldSeats})`
                });
            }

            event.totalSeats = totalSeats;

            event.availableSeats =
                totalSeats - soldSeats;
        }

        await event.save();

        if (
            poster &&
            oldPosterPublicId
        ) {
            try {
                await cloudinary.uploader.destroy(
                    oldPosterPublicId
                );
            } catch (cloudinaryDeleteError) {
                console.error(
                    "Failed to delete old event poster:",
                    cloudinaryDeleteError.message
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Event updated successfully",
            event
        });

    } catch (err) {

        if (newPosterPublicId) {

            try {

                await cloudinary.uploader.destroy(
                    newPosterPublicId
                );

            } catch (cleanupError) {

                console.error(
                    "Failed to clean up newly uploaded Cloudinary image:",
                    cleanupError.message
                );
            }
        }


        return res.status(500).json({
            success: false,
            message: "Failed to update event",
            error: err.message
        });


    } finally {

        // Always remove Multer temporary file

        if (req.file?.path) {
            await deleteLocalFile(
                req.file.path
            );
        }
    }
};

//Controller for fetching all approved events for users
export const getAllEvents = async (req, res) => {
    try {
        const {
            search,
            category,
            city,
            startDate,
            endDate,
            minPrice,
            maxPrice,
            sort = "latest",
            available,
        } = req.query;

        const page = Math.max(Number(req.query.page) || 1, 1);

        const limit = Math.min(
            Math.max(Number(req.query.limit) || 10, 1),
            50
        );

        const skip = (page - 1) * limit;


        const filter = {
            status: "approved",
            endDate: {
                $gte: new Date()
            }
        };

        if (search?.trim()) {
            filter.$text = {
                $search: search.trim()
            };
        }

        if (category?.trim()) {
            filter.category = category.trim();
        }


        if (city?.trim()) {
            filter["venue.city"] = {
                $regex: city.trim(),
                $options: "i"
            };
        }

        if (startDate || endDate) {
            filter.startDate = {};

            if (startDate) {
                const parsedStartDate = new Date(startDate);

                if (Number.isNaN(parsedStartDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid start date"
                    });
                }

                filter.startDate.$gte = parsedStartDate;
            }

            if (endDate) {
                const parsedEndDate = new Date(endDate);

                if (Number.isNaN(parsedEndDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid end date"
                    });
                }

                filter.startDate.$lte = parsedEndDate;
            }
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.ticketPrice = {};

            if (minPrice !== undefined) {
                const parsedMinPrice = Number(minPrice);

                if (
                    Number.isNaN(parsedMinPrice) ||
                    parsedMinPrice < 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid minimum price"
                    });
                }

                filter.ticketPrice.$gte = parsedMinPrice;
            }

            if (maxPrice !== undefined) {
                const parsedMaxPrice = Number(maxPrice);

                if (
                    Number.isNaN(parsedMaxPrice) ||
                    parsedMaxPrice < 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid maximum price"
                    });
                }
                filter.ticketPrice.$lte = parsedMaxPrice;
            }

            if (
                minPrice !== undefined &&
                maxPrice !== undefined &&
                Number(minPrice) > Number(maxPrice)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Minimum price cannot be greater than maximum price"
                });
            }
        }

        if (available === "true") {
            filter.availableSeats = {
                $gt: 0
            };
        }

        const sortOptions = {
            latest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            date_asc: { startDate: 1 },
            date_desc: { startDate: -1 },
            price_asc: { ticketPrice: 1 },
            price_desc: { ticketPrice: -1 },
        };

        const sortQuery = sortOptions[sort] || sortOptions.latest;

        const [events, totalEvents] = await Promise.all([
            eventModel
                .find(filter)
                .populate("organizer", "fullName email")
                .sort(sortQuery)
                .skip(skip)
                .limit(limit)
                .lean(),

            eventModel.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalEvents / limit);

        return res.status(200).json({
            success: true,
            message: events.length > 0 ? "Events fetched successfully" : "No events found",
            events,
            pagination: {
                currentPage: page,
                totalPages,
                totalEvents,
                eventsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch events",
            error: err.message
        });
    }
};

//Controller for fetching all events organized by organizer
export const getAllEventsByOrganizer = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;

        const user = await userModel.findById(req.user._id);
        if(user.role !== "organizer"){
            return res.status(403).json(
                {
                    success: false,
                    message: "Only organizers can fetch events"
                }
            );
        }
        const events = await eventModel
            .find({organizer: req.user._id})
            .populate("organizer", "fullName email")
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit);

        if(!events || events.length === 0){
            return res.status(200).json(
                {
                    success: true,
                    message: "No events found",
                    events: []
                }
            );
        }
        const totalEvents = await eventModel.countDocuments({organizer: req.user._id});
        const totalPages = Math.ceil(totalEvents/limit);

        return res.status(200).json({
            success: true,
            message: "Events fetched successfully",
            events,
            currentPage: page,
            totalPages,
            totalEvents,
            eventsPerPage: limit,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch events",
            error: err.message
        });
    }
}

//Controller for fetching events for admin based on status
export const getEventsForAdmin = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1 , 1);
        const limit = Math.max(Number(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;

        const filter = {};

        if(req.query.status){
            filter.status = req.query.status;
        }

        const user = await userModel.findById(req.user._id);
        if(user.role !== "admin"){
            return res.status(403).json(
                {
                    success: false,
                    message: "Only admins can fetch events"
                }
            );
        }

        const events = await eventModel.find(filter)
            .populate("organizer", "fullName email")
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit);

        const totalEvents = await eventModel.countDocuments(filter);
        const totalPages = Math.ceil(totalEvents/limit);

        if(!events || events.length === 0){
            return res.status(200).json(
                {
                    success: true,
                    message: "No events found",
                    events: []
                }
            );
        }
        return res.status(200).json({
            success: true,
            message: "Events fetched successfully",
            events,
            currentPage: page,
            totalPages,
            totalEvents,
            eventsPerPage: limit,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch events",
            error: err.message
        });
    }
}

//Controller for fetching event by id by user
export const getEventByIdForUser = async (req, res) => {
    try {
        const event = await eventModel.findOne({
            _id: req.params.id,
            status: "approved"
        })
            .populate("organizer", "fullName email");
        if(!event){
            return res.status(404).json(
                {
                    success: false,
                    message: "Event not found"
                }
            );
        }

        const soldSeats = event.soldSeats;

        return res.status(200).json({
            success: true,
            message: "Event fetched successfully",
            event,
            soldSeats
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch event",
            error: err.message
        });
    }
}

//Controller for admin to fetch event by id
export const getEventByIdForAdmin = async (req, res) => {
    try {
        const {role} = req.user;
        if(role !== "admin"){
            return res.status(403).json(
                {
                    success: false,
                    message: "Only admins can fetch events"
                }
            );
        }

        const event = await eventModel.findOne({
            _id: req.params.id,
        })
            .populate("organizer", "fullName email");
        if(!event){
            return res.status(404).json(
                {
                    success: false,
                    message: "Event not found"
                }
            );
        }

        const soldSeats = event.soldSeats;

        return res.status(200).json({
            success: true,
            message: "Event fetched successfully",
            event,
            soldSeats
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch event",
            error: err.message
        });
    }
}

//Controller for organizer to fetch own event by id
export const getEventByIdForOrganizer = async (req, res) => {
    try {
        const event = await eventModel
            .findOne({
                _id: req.params.id,
                organizer: req.user._id
            })
            .populate("organizer", "fullName email");

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found or you are not authorized to access it"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event fetched successfully",
            event,
            soldSeats: event.soldSeats
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch event",
            error: err.message
        });
    }
};

//Controller for organizer to delete an event
export const deleteEvent = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id);
        if(user.role !== "organizer"){
            return res.status(403).json(
                {
                    success: false,
                    message: "Only organizers can delete events"
                }
            );
        }
        const event = await eventModel.findById(req.params.id);
        if(!event){
            return res.status(404).json(
                {
                    success: false,
                    message: "Event not found"
                }
            );
        }

        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if(event.poster){
            await cloudinary.uploader.destroy(event.posterPublicId);
        }

        await event.deleteOne();

        const remainingEvents = await eventModel.find({organizer: req.user._id}).populate("organizer", "fullName email").sort({createdAt: -1});
        return res.status(200).json({
            success: true,
            message: "Event deleted successfully",
            events: remainingEvents
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete event",
            error: err.message
        });
    }
}

//Controller for admin to approve events
export const approveEvent = async (req, res) => {
    try {
        const {reviewRemark} = req.body;
        if(req.user.role !== "admin"){
            return res.status(403).json(
                {
                    success: false,
                    message: "Only admins can approve events"
                }
            );
        }
        const event = await eventModel.findOne({
            _id: req.params.id,
            status: "pending"
        }).populate("organizer", "fullName email");

        if(!event){
            return res.status(404).json(
                {
                    success: false,
                    message: "Event not found or already approved"
                }
            );
        }

        event.status = "approved";
        event.approvedBy = req.user._id;
        event.approvedAt = Date.now();
        event.reviewRemark = reviewRemark || "All Ok";
        await event.save();

        try {

    await createNotification({
        user: event.organizer._id,
        type: "event_approved",
        title: "Event Approved",
        message: `Your event "${event.title}" has been approved.`,
        relatedEvent: event._id
    });
    } catch (notificationError) {
        console.error("Event approval notification failed:",notificationError);
    }

    return res.status(200).json({
        success: true,
        message: "Event approved successfully",
        event
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to approve event",
            error: err.message
        });
    }
}

//Controller for admin to reject events
export const rejectEvent = async (req, res) => {
    try {
        const { reviewRemark } = req.body;
        if(req.user.role !== "admin"){
            return res.status(403).json(
                {
                    success: false,
                    message: "Only admins can reject events"
                }
            );
        }
        const event = await eventModel.findOne({
            _id: req.params.id,
            status: "pending"
        }).populate("organizer", "fullName email");
        if(!event){
            return res.status(404).json(
                {
                    success: false,
                    message: "Event not found or already reviewed"
                }
            );
        }

        event.status = "rejected";
        event.rejectedBy = req.user._id;
        event.rejectedAt = Date.now();
        event.reviewRemark = reviewRemark;
        await event.save();

        try {

    await createNotification({
        user: event.organizer._id,
        type: "event_rejected",
        title: "Event Rejected",
        message: reviewRemark
            ? `Your event "${event.title}" was rejected. Reason: ${reviewRemark}`
            : `Your event "${event.title}" was rejected.`,
        relatedEvent: event._id
    });
    } catch (notificationError) {
        console.error("Event rejection notification failed:",notificationError);
    }

        return res.status(200).json({
            success: true,
            message: "Event rejected successfully",
            event
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to reject event",
            error: err.message
        });
    }
}


