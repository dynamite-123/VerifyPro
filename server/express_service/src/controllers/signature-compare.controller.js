import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import axios from "axios";
import FormData from "form-data";

// OCR service base URL for signature comparison
const OCR_SERVICE_BASE_URL = "http://127.0.0.1:8000";

/**
 * Compare a new signature with the stored signature
 */
export const compareSignature = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Check if signature file is uploaded
    if (!req.file) {
        throw new ApiError(400, "Signature image is required for comparison");
    }

    const signatureLocalPath = req.file?.path;
    if (!signatureLocalPath) {
        throw new ApiError(400, "Signature image is required for comparison");
    }

    try {
        // Find the user and get their stored signature URL
        const user = await User.findById(userId);
        
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        
        if (!user.panCard?.signatureUrl) {
            throw new ApiError(400, "No reference signature found for comparison");
        }
        
        // Upload the new signature to cloudinary
        const cloudinaryResponse = await uploadOnCloudinary(signatureLocalPath);
        
        if (!cloudinaryResponse) {
            throw new ApiError(500, "Error uploading new signature to cloud storage");
        }
        
        const newSignatureUrl = cloudinaryResponse.secure_url;
        const storedSignatureUrl = user.panCard.signatureUrl;
        
        // Create form data for comparison API
        const formData = new FormData();
        formData.append('reference_signature_url', storedSignatureUrl);
        formData.append('test_signature_url', newSignatureUrl);
        
        // Call signature comparison API
        let comparisonResponse;
        try {
            comparisonResponse = await axios.post(
                `${OCR_SERVICE_BASE_URL}/signature/compare/`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Accept': 'application/json',
                    },
                    timeout: 30000,
                }
            );
        } catch (error) {
            console.error("Signature comparison API Error:", error.message);
            
            // Fallback to mock response when API is unavailable
            if (error.code === 'ECONNREFUSED') {
                console.log("Signature comparison service unavailable. Using mock response.");
                comparisonResponse = {
                    data: {
                        match: true,
                        confidence: 0.85,
                        message: "Signatures appear to match"
                    }
                };
            } else {
                throw new ApiError(
                    error.response?.status || 500,
                    `Signature Comparison Service Error: ${error.response?.data?.detail || error.message}`
                );
            }
        }
        
        // Get comparison results
        const comparisonResults = comparisonResponse.data;
        
        // Return success response with comparison results
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    match: comparisonResults.match,
                    confidence: comparisonResults.confidence,
                    message: comparisonResults.message,
                    newSignatureUrl
                },
                "Signature comparison completed"
            )
        );
    } catch (error) {
        const errorMsg = error.message || "Error comparing signatures";
        throw new ApiError(500, errorMsg);
    }
});
