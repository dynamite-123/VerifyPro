import multer from "multer";
import path from "path";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";

// Create upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "public/temp");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    // Accept images and PDF only
    if (file.mimetype === "image/png" || 
        file.mimetype === "image/jpg" || 
        file.mimetype === "image/jpeg" || 
        file.mimetype === "image/webp" ||
        file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(
            new ApiError(
                400, 
                "Unsupported file format. Only PNG, JPG, JPEG, WEBP and PDF are allowed."
            ), 
            false
        );
    }
};

// Export multer middleware
export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max file size
    },
    fileFilter
});

// Cleanup function to remove temp files
export const removeTemporaryFiles = (filePaths) => {
    if (Array.isArray(filePaths)) {
        filePaths.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
    } else if (filePaths && fs.existsSync(filePaths)) {
        fs.unlinkSync(filePaths);
    }
};
