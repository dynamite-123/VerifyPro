import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


/**
 * Upload a signature extracted from PAN card
 */
export const uploadSignature = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Check if signature file is uploaded
    if (!req.file) {
        throw new ApiError(400, "Signature image is required");
    }

    const signatureLocalPath = req.file?.path;
    if (!signatureLocalPath) {
        throw new ApiError(400, "Signature image is required");
    }

    try {
        // Store the local file path (relative to public directory)
        // Example: public/temp/signature-xxxx.png => /temp/signature-xxxx.png
        const publicIndex = signatureLocalPath.indexOf("public");
        let signatureUrl = signatureLocalPath;
        if (publicIndex !== -1) {
            signatureUrl = signatureLocalPath.substring(publicIndex + 6).replace(/\\/g, "/");
        }
        // Ensure it starts with a slash
        if (!signatureUrl.startsWith("/")) {
            signatureUrl = "/" + signatureUrl;
        }

        // Update user with signature file URL (local path)
        const user = await User.findByIdAndUpdate(
            userId,
            {
                "panCard.signature_present": true,
                "panCard.signatureUrl": signatureUrl,
            },
            { new: true }
        ).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(500, "Error updating user with signature data");
        }

        // Return success response
        return res.status(200).json(
            new ApiResponse(
                200,
                { user },
                "Signature uploaded successfully"
            )
        );
    } catch (error) {
        const errorMsg = error.message || "Error processing signature";
        throw new ApiError(500, errorMsg);
    }
});

/**
 * Get the user's signature (local file URL)
 */
export const getSignature = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        // Find the user and get their signature URL
        const user = await User.findById(userId).select("panCard.signatureUrl panCard.signature_present");
        
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        
        if (!user.panCard?.signature_present || !user.panCard?.signatureUrl) {
            throw new ApiError(404, "No signature found for this user");
        }
        
        // Return the signature URL (local path)
        return res.status(200).json(
            new ApiResponse(
                200,
                { 
                    signatureUrl: user.panCard.signatureUrl 
                },
                "Signature retrieved successfully"
            )
        );
    } catch (error) {
        const errorMsg = error.message || "Error retrieving signature";
        throw new ApiError(error.status || 500, errorMsg);
    }
});
