import { Router } from "express";
import { performKYC, getKYCStatus } from "../controllers/kyc.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Manual KYC check trigger
router.route("/verify").post(performKYC);

// Get KYC status
router.route("/status").get(getKYCStatus);

export default router;
