import express from "express";

import {getMyNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification} from "../controllers/notification.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const notificationRouter = express.Router();

notificationRouter.get("/", authMiddleware, getMyNotifications);

notificationRouter.get("/unread-count", authMiddleware, getUnreadNotificationCount);

notificationRouter.patch("/read-all", authMiddleware, markAllNotificationsAsRead);

notificationRouter.patch("/:notificationId/read", authMiddleware, markNotificationAsRead);

notificationRouter.delete("/:notificationId", authMiddleware, deleteNotification);


export default notificationRouter;