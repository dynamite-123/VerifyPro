import { Router } from "express";
import { uploadSignature, getSignature } from "../controllers/signature.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all routes with JWT verification
router.use(verifyJWT);

// Route to upload signature
router.post(
    "/upload",
    upload.single("signature"),
    uploadSignature
);

// Route to retrieve signature
router.get("/get", getSignature);

export default router;
