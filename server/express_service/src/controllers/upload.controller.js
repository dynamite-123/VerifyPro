import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const uploadAadhaarCard = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!req.files || !req.files.front || !req.files.back) {
        throw new ApiError(400, "Both front and back images of Aadhaar card are required");
    }

    const frontImageLocalPath = req.files.front[0]?.path;
    const backImageLocalPath = req.files.back[0]?.path;

    if (!frontImageLocalPath || !backImageLocalPath) {
        throw new ApiError(400, "Front and back images of Aadhaar card are required");
    }

    try {
        const formData = new FormData();
        
        const frontImageBuffer = fs.readFileSync(frontImageLocalPath);
        const backImageBuffer = fs.readFileSync(backImageLocalPath);
        
        if (!frontImageBuffer.length || !backImageBuffer.length) {
            throw new ApiError(400, "Invalid or empty image files");
        }
        
        formData.append('files', frontImageBuffer, {
            filename: path.basename(frontImageLocalPath),
            contentType: req.files.front[0].mimetype,
            knownLength: frontImageBuffer.length
        });
        
        formData.append('files', backImageBuffer, {
            filename: path.basename(backImageLocalPath),
            contentType: req.files.back[0].mimetype,
            knownLength: backImageBuffer.length
        });

        console.log("Sending Aadhaar images to OCR service...");
        let ocrResponse;
        try {
            ocrResponse = await axios.post(
                `${process.env.OCR_SERVICE_BASE_URL}/ocr/extract-aadhaar/`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Accept': 'application/json',
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 60000,
                }
            );
            console.log("OCR service response received successfully");
        } catch (error) {
            console.error("OCR API Error:", error.message);
            if (error.response) {
                console.error("OCR API Response:", error.response.data);
            }
            throw new ApiError(
                error.response?.status || 500,
                `OCR Service Error: ${error.response?.data?.detail || error.message}`
            );
        }

        const extractedData = ocrResponse.data;
        
        if (!extractedData || extractedData.length === 0) {
            throw new ApiError(400, "Could not extract data from Aadhaar card images");
        }

        const aadhaarData = extractedData[0];

        const user = await User.findByIdAndUpdate(
            userId,
            {
                "aadhaarCard.aadhaar_number": aadhaarData.aadhaar_number,
                "aadhaarCard.full_name": aadhaarData.full_name,
                "aadhaarCard.date_of_birth": aadhaarData.date_of_birth,
                "aadhaarCard.gender": aadhaarData.gender,
                "aadhaarCard.address": aadhaarData.address,
                "aadhaarCard.father_name": aadhaarData.father_name,
                "aadhaarCard.phone_number": aadhaarData.phone_number,
                "aadhaarCard.email": aadhaarData.email,
                "aadhaarCard.pin_code": aadhaarData.pin_code,
                "aadhaarCard.state": aadhaarData.state,
                "aadhaarCard.district": aadhaarData.district,
                "aadhaarCard.verified": false,
            },
            { new: true }
        ).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(500, "Error updating user with Aadhaar card data");
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                { user },
                "Aadhaar card uploaded and data extracted successfully"
            )
        );
    } catch (error) {
        const errorMsg = error.response?.data?.detail || error.message || "Error processing Aadhaar card";
        throw new ApiError(error.response?.status || 500, errorMsg);
    } finally {
    }
});

export const uploadPanCard = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!req.file) {
        throw new ApiError(400, "PAN card image is required");
    }

    const panCardImageLocalPath = req.file?.path;
    if (!panCardImageLocalPath) {
        throw new ApiError(400, "PAN card image is required");
    }

    try {
        const formData = new FormData();
        
        const panCardBuffer = fs.readFileSync(panCardImageLocalPath);
        
        if (!panCardBuffer.length) {
            throw new ApiError(400, "Invalid or empty PAN card image");
        }
        
        formData.append('files', panCardBuffer, {
            filename: path.basename(panCardImageLocalPath),
            contentType: req.file.mimetype,
            knownLength: panCardBuffer.length
        });

        console.log("Sending PAN card image to OCR service...");
        let ocrResponse;
        try {
            ocrResponse = await axios.post(
                `${process.env.OCR_SERVICE_BASE_URL}/ocr/extract-pan/`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Accept': 'application/json',
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 60000,
                }
            );
            console.log("OCR service response received successfully");
        } catch (error) {
            console.error("OCR API Error:", error.message);
            if (error.response) {
                console.error("OCR API Response:", error.response.data);
            }
            throw new ApiError(
                error.response?.status || 500,
                `OCR Service Error: ${error.response?.data?.detail || error.message}`
            );
        }

        const extractedData = ocrResponse.data;
        
        if (!extractedData || extractedData.length === 0) {
            throw new ApiError(400, "Could not extract data from PAN card image");
        }

        const panData = extractedData[0];

        const user = await User.findByIdAndUpdate(
            userId,
            {
                "panCard.pan_number": panData.pan_number,
                "panCard.full_name": panData.full_name,
                "panCard.father_name": panData.father_name,
                "panCard.date_of_birth": panData.date_of_birth,
                "panCard.photo_present": panData.photo_present,
                "panCard.signature_present": panData.signature_present,
                "panCard.verified": false,
            },
            { new: true }
        ).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(500, "Error updating user with PAN card data");
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                { user },
                "PAN card uploaded and data extracted successfully"
            )
        );
    } catch (error) {
        const errorMsg = error.response?.data?.detail || error.message || "Error processing PAN card";
        throw new ApiError(error.response?.status || 500, errorMsg);
    } finally {
    }
});
