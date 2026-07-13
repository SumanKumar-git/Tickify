import fs from "fs/promises";

export const deleteLocalFile = async (filePath) => {
    if (!filePath) {
        return;
    }
    try {
        await fs.unlink(filePath);
    } catch (err) {
        // Ignore if the file has already been deleted
        if (err.code !== "ENOENT") {
            console.error(
                `Failed to delete temporary file: ${filePath}`,
                err.message
            );
        }
    }
};