import express from "express";
import { getMyRefunds, getRefundById, processRefund, getAllRefundsForAdmin } from "../controllers/refund.controller.js";

import {authMiddleware} from "../middlewares/auth.middleware.js";


const refundRouter = express.Router();

refundRouter.get("/my-refunds", authMiddleware, getMyRefunds);

refundRouter.get("/admin/all-refunds", authMiddleware, getAllRefundsForAdmin);

refundRouter.get("/:refundId", authMiddleware, getRefundById);

refundRouter.patch("/:refundId/process", authMiddleware, processRefund);

export default refundRouter;