import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

export const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({
            success: false,
            message: "Unauthorized access, token is missing"
        })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId);

        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        req.user = user;

        return next();
    }
    catch(err){
        return res.status(401).json({
            success: false,
            message: "Unauthorized access, token is invalid",
            error: err.message
        })
    }
}

