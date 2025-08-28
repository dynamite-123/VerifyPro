import { Router } from "express";
import { 
    sendOTPForVerification,
    verifyOTP,
    resendOTP,
    sendKYCStatusSMS
} from "../controllers/otp.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/send", sendOTPForVerification);
router.post("/verify", verifyOTP);
router.post("/resend", resendOTP);
router.post("/kyc-status", sendKYCStatusSMS);

export default router;
