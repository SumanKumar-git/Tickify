import multer from "multer";

const upload = multer({

    dest: "uploads/",

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Only JPEG, PNG and WebP images are allowed"
                )
            );
        }
        cb(null, true);
    }
});

export default upload;