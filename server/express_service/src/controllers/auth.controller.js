import axios from "axios";
import FormData from "form-data";
import { sendOTP } from "../utils/mailUtil.js";
import fs from "fs";
import path from "path";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.model.js";
// cloudinary removed; using local file path for avatar
import jwt from "jsonwebtoken";

// Utility to load JSON files synchronously
function loadJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// Send OTP to user via email
const sendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required");
    }
    
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    
    try {
        console.log("Attempting to send OTP to:", email);
        const otp = await sendOTP(email);
        console.log("OTP generated:", otp);
        
        // Store OTP in user record
        user.otpVerification = {
            phoneNumber: user.phoneNumber,
            status: "pending",
            sentAt: new Date(),
            otp: otp
        };
        await user.save();
        
        console.log("OTP saved to database for user:", user._id);
        return res.status(200).json(new ApiResponse(200, { otp: otp }, "OTP sent successfully"));
    } catch (error) {
        console.error("Error sending OTP:", error);
        throw new ApiError(500, `Failed to send OTP: ${error.message}`);
    }
});

// Endpoint: POST /verify-otp-image
// Body: { email } + image file (form-data, field 'file')
const verifyOtpImage = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required");
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    if (!req.file) {
        throw new ApiError(400, "Image file is required");
    }
    // Prepare image for OCR service
    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);
    const ocrUrl = `${process.env.OCR_SERVICE_BASE_URL}/otp/detect`;
    let extractedOtp;
    try {
        const response = await axios.post(ocrUrl, formData, {
            headers: formData.getHeaders()
        });
        extractedOtp = response.data.otp;
    } catch (err) {
        return res.status(500).json(new ApiResponse(500, {}, "OCR service error"));
    }
    // Compare with stored OTP (assume user.otpVerification.otp)
    const storedOtp = user.otpVerification?.otp;
    if (!storedOtp) {
        return res.status(400).json(new ApiResponse(400, {}, "No OTP generated for user"));
    }
    if (extractedOtp === storedOtp) {
        user.otpVerification.status = "verified";
        user.otpVerification.verifiedAt = new Date();
        await user.save();
        return res.status(200).json(new ApiResponse(200, { verified: true }, "OTP verified successfully"));
    } else {
        user.otpVerification.status = "failed";
        await user.save();
        return res.status(400).json(new ApiResponse(400, { verified: false }, "OTP verification failed"));
    }
});

// Risk score endpoint
const getRiskScore = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!userId?.trim()) {
        throw new ApiError(400, "User ID is missing");
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Load red flag files
    const baseDir = path.resolve("server/express_service/src/red flag records");
    const peps = loadJson(path.join(baseDir, "peps.json"));
    const sanctions = loadJson(path.join(baseDir, "sanction_names_only.json"));
    const adverseMedia = loadJson(path.join(baseDir, "adverse_media.json"));

    let score = 100; // Start with max score
    let flags = [];
    const userName = user.name?.trim().toUpperCase();

    // Check sanctions (array of names)
    if (sanctions.some(n => n.trim().toUpperCase() === userName)) {
        score -= 40;
        flags.push("Sanction List Match");
    }

    // Check PEPs (array of objects with 'name')
    if (peps.some(p => p.name?.trim().toUpperCase() === userName)) {
        score -= 30;
        flags.push("PEP List Match");
    }

    // Check Adverse Media (array of objects with 'entity')
    if (adverseMedia.some(a => a.entity?.trim().toUpperCase() === userName)) {
        score -= 20;
        flags.push("Adverse Media Match");
    }

    // Advanced KYC Risk Assessment
    let kycRiskAdjustment = 0;
    let kycDetails = {
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        timeToComplete: 0
    };

    // 1. KYC Completeness Analysis
    const requiredFields = ['panCard', 'aadhaarCard', 'address', 'dateOfBirth'];
    const completedFields = requiredFields.filter(field => {
        if (field === 'panCard') return user.panCard?.pan_number;
        if (field === 'aadhaarCard') return user.aadhaarCard?.aadhaar_number;
        if (field === 'address') return user.aadhaarCard?.address;
        if (field === 'dateOfBirth') return user.panCard?.date_of_birth || user.aadhaarCard?.date_of_birth;
        return false;
    });
    
    const completenessRatio = completedFields.length / requiredFields.length;
    kycDetails.completeness = Math.round(completenessRatio * 100);
    
    if (completenessRatio < 0.5) {
        kycRiskAdjustment -= 30;
        flags.push("Incomplete KYC Documentation");
    } else if (completenessRatio < 0.8) {
        kycRiskAdjustment -= 15;
        flags.push("Partially Complete KYC");
    } else if (completenessRatio === 1) {
        kycRiskAdjustment += 10;
    }

    // 2. Document Verification Quality Assessment
    if (user.kycVerification?.checks?.length) {
        let passedChecks = 0;
        let criticalFailures = 0;
        let minorFailures = 0;
        
        const criticalChecks = ['PAN Format', 'Aadhaar Format', 'Name Match'];
        const minorChecks = ['DOB Match', 'Address Validation', 'Father Name Match'];
        
        user.kycVerification.checks.forEach(check => {
            if (check.status === 'PASS') {
                passedChecks++;
                kycRiskAdjustment += 1;
            } else if (check.status === 'FAIL') {
                if (criticalChecks.includes(check.step)) {
                    criticalFailures++;
                    kycRiskAdjustment -= 15;
                    flags.push(`Critical KYC Failure: ${check.step}`);
                } else if (minorChecks.includes(check.step)) {
                    minorFailures++;
                    kycRiskAdjustment -= 5;
                    flags.push(`Minor KYC Issue: ${check.step}`);
                }
            } else if (check.status === 'MANUAL_CHECK') {
                kycRiskAdjustment -= 8;
                flags.push(`Manual Review Required: ${check.step}`);
            }
        });
        
        const totalChecks = user.kycVerification.checks.length;
        kycDetails.accuracy = Math.round((passedChecks / totalChecks) * 100);
        
        // Consistency scoring based on cross-verification
        const nameMatchCheck = user.kycVerification.checks.find(c => c.step === 'Name Match');
        const dobMatchCheck = user.kycVerification.checks.find(c => c.step === 'DOB Match');
        
        let consistencyScore = 100;
        if (nameMatchCheck?.status === 'FAIL') consistencyScore -= 40;
        if (dobMatchCheck?.status === 'FAIL') consistencyScore -= 30;
        if (criticalFailures > 0) consistencyScore -= (criticalFailures * 20);
        if (minorFailures > 1) consistencyScore -= (minorFailures * 10);
        
        kycDetails.consistency = Math.max(0, consistencyScore);
        
        // Penalize multiple failures
        if (criticalFailures >= 2) {
            kycRiskAdjustment -= 25;
            flags.push("Multiple Critical Document Issues");
        }
    }

    // 3. Time-based Risk Assessment
    const accountAge = user.createdAt ? (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24) : 0;
    if (accountAge < 1) {
        kycRiskAdjustment -= 20;
        flags.push("Very New Account");
    } else if (accountAge < 7) {
        kycRiskAdjustment -= 10;
        flags.push("New Account");
    } else if (accountAge > 90) {
        kycRiskAdjustment += 5; // Established account bonus
    }

    // 4. Behavioral Risk Indicators
    if (user.loginAttempts && user.loginAttempts > 5) {
        kycRiskAdjustment -= 15;
        flags.push("Multiple Failed Login Attempts");
    }

    if (user.otpVerification?.status === 'failed') {
        kycRiskAdjustment -= 10;
        flags.push("Failed OTP Verification");
    } else if (user.otpVerification?.status === 'verified') {
        kycRiskAdjustment += 8;
    }

    // 5. Device and Location Risk (placeholder for future implementation)
    const deviceRisk = 0; // Could check for VPN, suspicious devices, etc.
    const locationRisk = 0; // Could check for high-risk countries, IP reputation

    // Calculate KYC completion time impact
    if (user.kycVerification?.performed_at && user.createdAt) {
        const kycCompletionTime = (new Date(user.kycVerification.performed_at) - new Date(user.createdAt)) / (1000 * 60 * 60);
        kycDetails.timeToComplete = Math.round(kycCompletionTime);
        
        if (kycCompletionTime < 1) {
            kycRiskAdjustment -= 15; // Too fast completion is suspicious
            flags.push("Unusually Fast KYC Completion");
        } else if (kycCompletionTime > 168) { // More than a week
            kycRiskAdjustment -= 5;
            flags.push("Delayed KYC Completion");
        }
    }

    score += kycRiskAdjustment;

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Determine risk level and recommended action
    let riskLevel, recommendedAction;
    if (score >= 80) {
        riskLevel = 'LOW';
        recommendedAction = 'APPROVED';
    } else if (score >= 60) {
        riskLevel = 'MEDIUM';
        recommendedAction = 'APPROVED';
    } else if (score >= 40) {
        riskLevel = 'HIGH';
        recommendedAction = 'PENDING_REVIEW';
        flags.push("High Risk - Manual Review Required");
    } else {
        riskLevel = 'CRITICAL';
        recommendedAction = 'PENDING_REVIEW';
        flags.push("Critical Risk - Comprehensive Manual Review Required");
    }

    // Update user's KYC verification status if needed
    if (user.kycVerification && user.kycVerification.overall_status !== recommendedAction) {
        await User.findByIdAndUpdate(userId, {
            "kycVerification.overall_status": recommendedAction,
            "kycVerification.risk_assessment_performed_at": new Date(),
            "kycStatus": recommendedAction === 'APPROVED' ? 'verified' : 'pending'
        });
    }

    return res.status(200).json(new ApiResponse(200, {
        userId,
        name: user.name,
        riskScore: score,
        riskLevel,
        recommendedAction,
        flags,
        kycStatus: user.kycStatus,
        kycVerification: user.kycVerification,
        riskAnalysis: {
            watchlistMatches: {
                sanctions: sanctions.some(n => n.trim().toUpperCase() === userName),
                peps: peps.some(p => p.name?.trim().toUpperCase() === userName),
                adverseMedia: adverseMedia.some(a => a.entity?.trim().toUpperCase() === userName)
            },
            kycAnalysis: kycDetails,
            accountAge: Math.round(accountAge),
            behavioralRisk: {
                otpStatus: user.otpVerification?.status || 'not_attempted',
                loginAttempts: user.loginAttempts || 0
            }
        }
    }, "Risk score calculated successfully"));
});

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    try {
        console.log("Registration request body:", req.body);
        const { name, email, phoneNumber, password } = req.body;

        // Enhanced validation with better error messages
        if (!name || !name.trim()) {
            throw new ApiError(400, "Name is required");
        }
        
        if (!email || !email.trim()) {
            throw new ApiError(400, "Email is required");
        }
        
        if (!phoneNumber || !phoneNumber.trim()) {
            throw new ApiError(400, "Phone number is required");
        }
        
        if (!password || !password.trim()) {
            throw new ApiError(400, "Password is required");
        }

        const existedUser = await User.findOne({
            $or: [{ email }, { phoneNumber }]
        });

        if (existedUser) {
            throw new ApiError(409, "User with email or phone number already exists");
        }

        const user = await User.create({
            name,
            email,
            phoneNumber,
            password
        });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }
        
        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
    } catch (error) {
        console.error("Registration error:", error);
        throw new ApiError(error.statusCode || 500, error.message || "Registration failed");
    }
});

const loginUser = asyncHandler(async (req, res) => {
    try {
        console.log("Login request body:", req.body);
        const { email, phoneNumber, password } = req.body;

        if (!phoneNumber && !email) {
            throw new ApiError(400, "Email or phone number is required");
        }

        if (!password) {
            throw new ApiError(400, "Password is required");
        }

        const user = await User.findOne({
            $or: [{ phoneNumber }, { email }]
        });

        if (!user) {
            throw new ApiError(404, "User does not exist");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        loggedInUser.isOnline = true;
        loggedInUser.lastActive = new Date();
        await loggedInUser.save({ validateBeforeSave: false });

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken,
                        refreshToken
                    },
                    "User logged in successfully"
                )
            );
    } catch (error) {
        console.error("Login error:", error);
        throw new ApiError(error.statusCode || 500, error.message || "Login failed");
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            },
            isOnline: false,
            lastActive: new Date()
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        };

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name, email, phoneNumber } = req.body;

    if (!name || !email || !phoneNumber) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                name,
                email,
                phoneNumber
            }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const photoLocalPath = req.file?.path;

    if (!photoLocalPath) {
        throw new ApiError(400, "Photo file is missing");
    }

    // store the local path (or later switch to another uploader)
    const storedPhotoUrl = photoLocalPath.replace(/\\/g, "/");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                photo: storedPhotoUrl
            }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Profile photo updated successfully")
        );
});

const getUserProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId?.trim()) {
        throw new ApiError(400, "User ID is missing");
    }

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User profile fetched successfully")
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    getUserProfile,
    getRiskScore,
    verifyOtpImage,
    sendOtp
};
