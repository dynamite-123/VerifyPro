import { Router } from "express";
import { 
    uploadAadhaarCard, 
    uploadPanCard 
} from "../controllers/upload.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all routes with JWT verification
router.use(verifyJWT);

// Route to upload Aadhaar card (front and back images)
router.post(
    "/aadhaar",
    upload.fields([
        { name: "front", maxCount: 1 },
        { name: "back", maxCount: 1 }
    ]),
    uploadAadhaarCard
);

// Route to upload PAN card
router.post(
    "/pan",
    upload.fields([
        { name: "file", maxCount: 1 },
        { name: "signature", maxCount: 1 }
    ]),
    uploadPanCard
);

export default router;
