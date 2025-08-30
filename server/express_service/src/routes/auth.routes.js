import { Router } from "express";
import {
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
} from "../controllers/auth.controller.js";

import multer from "multer";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// verify-otp-image will accept JSON with an imageBase64 field
router.route("/verify-otp-image").post(verifyOtpImage);
router.route("/risk-score/:userId").get(getRiskScore);
router.route("/send-otp").post(sendOtp);


router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/photo").patch(verifyJWT, upload.single("photo"), updateUserAvatar);
router.route("/profile/:userId").get(getUserProfile);

export default router;
