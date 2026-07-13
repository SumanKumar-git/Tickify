import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
    return bcrypt.hash(password, 12);
};