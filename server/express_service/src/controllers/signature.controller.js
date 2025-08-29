import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
        // Upload signature to cloudinary
        const cloudinaryResponse = await uploadOnCloudinary(signatureLocalPath);
        
        if (!cloudinaryResponse) {
            throw new ApiError(500, "Error uploading signature to cloud storage");
        }

        // Update user with signature file URL from cloudinary
        const user = await User.findByIdAndUpdate(
            userId,
            {
                "panCard.signature_present": true,
                "panCard.signatureUrl": cloudinaryResponse.secure_url,
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
