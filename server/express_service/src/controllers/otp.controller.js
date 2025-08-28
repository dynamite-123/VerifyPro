import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import TwilioService from "../utils/twilioService.js";

const twilioService = new TwilioService();

export const sendOTPForVerification = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        throw new ApiError(400, "Phone number is required");
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const result = await twilioService.sendOTP(phoneNumber);
        
        if (!result.success) {
            throw new ApiError(500, `Failed to send OTP: ${result.error}`);
        }

        await User.findByIdAndUpdate(userId, {
            $set: {
                'otpVerification.phoneNumber': phoneNumber,
                'otpVerification.status': 'pending',
                'otpVerification.sentAt': new Date(),
                'otpVerification.verificationSid': result.sid
            }
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                { 
                    status: result.status,
                    phoneNumber: phoneNumber
                },
                "OTP sent successfully"
            )
        );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Error sending OTP"
        );
    }
});

export const verifyOTP = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
        throw new ApiError(400, "Phone number and OTP are required");
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const result = await twilioService.verifyOTP(phoneNumber, otp);
        
        if (!result.success) {
            await User.findByIdAndUpdate(userId, {
                $set: {
                    'otpVerification.status': 'failed',
                    'otpVerification.verifiedAt': new Date()
                }
            });
            
            throw new ApiError(400, `OTP verification failed: ${result.error || 'Invalid OTP'}`);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    'otpVerification.status': 'verified',
                    'otpVerification.verifiedAt': new Date(),
                    'phoneVerified': true
                }
            },
            { new: true }
        ).select("-password -refreshToken");

        return res.status(200).json(
            new ApiResponse(
                200,
                { 
                    user: updatedUser,
                    status: result.status
                },
                "OTP verified successfully"
            )
        );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Error verifying OTP"
        );
    }
});

export const resendOTP = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        throw new ApiError(400, "Phone number is required");
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const lastSent = user.otpVerification?.sentAt;
        if (lastSent) {
            const timeDiff = Date.now() - new Date(lastSent).getTime();
            const cooldownPeriod = 60000; // 1 minute
            
            if (timeDiff < cooldownPeriod) {
                const remainingTime = Math.ceil((cooldownPeriod - timeDiff) / 1000);
                throw new ApiError(
                    429, 
                    `Please wait ${remainingTime} seconds before requesting another OTP`
                );
            }
        }

        const result = await twilioService.sendOTP(phoneNumber);
        
        if (!result.success) {
            throw new ApiError(500, `Failed to resend OTP: ${result.error}`);
        }

        await User.findByIdAndUpdate(userId, {
            $set: {
                'otpVerification.phoneNumber': phoneNumber,
                'otpVerification.status': 'pending',
                'otpVerification.sentAt': new Date(),
                'otpVerification.verificationSid': result.sid
            }
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                { 
                    status: result.status,
                    phoneNumber: phoneNumber
                },
                "OTP resent successfully"
            )
        );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Error resending OTP"
        );
    }
});

export const sendKYCStatusSMS = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        let message = "";
        const userName = user.name;

        switch (user.kycStatus) {
            case 'verified':
                message = `Hello ${userName}, your KYC verification has been approved! You can now access all features of VerifyPro.`;
                break;
            case 'rejected':
                message = `Hello ${userName}, your KYC verification was rejected. Reason: ${user.kycRejectedReason || 'Please resubmit your documents.'}`;
                break;
            case 'pending':
                message = `Hello ${userName}, your KYC verification is under review. We'll notify you once it's processed.`;
                break;
            default:
                throw new ApiError(400, "Invalid KYC status");
        }

        const result = await twilioService.sendCustomSMS(user.phoneNumber, message);
        
        if (!result.success) {
            throw new ApiError(500, `Failed to send SMS: ${result.error}`);
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                { 
                    status: result.status,
                    messageSid: result.sid
                },
                "KYC status SMS sent successfully"
            )
        );
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Error sending KYC status SMS"
        );
    }
});
