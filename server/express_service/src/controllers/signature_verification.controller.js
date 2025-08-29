import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeTemporaryFiles } from "../middlewares/upload.middleware.js";


export const verifySignatureWithOcr = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Check that uploaded signature file exists
    if (!req.file) {
        throw new ApiError(400, "Uploaded signature file is required");
    }

    // Get user's stored extracted signature URL/path
    const user = await User.findById(userId).select("panCard.signatureUrl panCard.signature_present");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Resolve local file paths for both files
    const uploadedSignaturePath = req.file.path;

    // Find the single stored signature file in public/temp with prefix 'signature'
    const tempDir = path.join(process.cwd(), 'public', 'temp');
    let storedSignaturePath = null;
    try {
        const files = fs.readdirSync(tempDir);
        const sigFile = files.find(f => f.startsWith('signature'));
        if (sigFile) {
            storedSignaturePath = path.join(tempDir, sigFile);
        }
    } catch (err) {
        // ignore, will handle missing file below
    }

    if (!storedSignaturePath || !fs.existsSync(storedSignaturePath)) {
        // If no stored signature file is available in public/temp, return unmatched with 0.0
        return res.status(200).json({
            result: 'unmatched',
            accuracy_score: 0.0,
            message: 'No extracted signature file found in server public/temp — treated as unmatched.'
        });
    }

    // We'll track the temp files so we can remove them when finished
    const tempFilesToRemove = [uploadedSignaturePath, storedSignaturePath];
    try {
        const uploadedBuffer = fs.readFileSync(uploadedSignaturePath);
        const storedBuffer = fs.readFileSync(storedSignaturePath);

        const formData = new FormData();
        // FastAPI endpoint expects fields named signature1 and signature2
        formData.append('signature1', uploadedBuffer, { filename: path.basename(uploadedSignaturePath) });
        formData.append('signature2', storedBuffer, { filename: path.basename(storedSignaturePath) });

        const ocrBase = process.env.OCR_SERVICE_BASE_URL;
        if (!ocrBase) {
            throw new ApiError(500, "OCR service base URL is not configured on the server");
        }

        const response = await axios.post(
            `${ocrBase}/signature/verify`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    Accept: 'application/json'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 60000
            }
        );

        // Forward the response from the OCR service
        return res.status(response.status).json(response.data);
    } catch (err) {
        // Normalize axios errors
        if (err.response) {
            const status = err.response.status || 500;
            const message = err.response.data?.detail || err.response.data || err.message;
            throw new ApiError(status, `OCR Signature Verification Error: ${message}`);
        }
        throw err;
    } finally {
        // Attempt to remove temp files (ignore errors)
        try {
            removeTemporaryFiles(tempFilesToRemove);
        } catch (cleanupErr) {
            console.error('Failed to remove temp signature files:', cleanupErr && cleanupErr.message);
        }
    }
});
