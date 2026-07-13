import jwt from "jsonwebtoken";

export const generateJwtToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: "3d"
    })
}