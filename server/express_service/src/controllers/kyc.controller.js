import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function validatePANFormat(pan) {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
}

function validateAadhaarFormat(aadhaar) {
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(aadhaar);
}

// Simple Levenshtein distance for fuzzy name matching
function levenshtein(a, b) {
  if (!a || !b) return Math.max((a || "").length, (b || "").length);
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => 0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

function fuzzyMatch(str1, str2, threshold = 0.8) {
  if (!str1 || !str2) return false;
  const distance = levenshtein(str1.toUpperCase(), str2.toUpperCase());
  const maxLen = Math.max(str1.length, str2.length);
  const similarity = 1 - distance / maxLen;
  return similarity >= threshold;
}

// Function to perform KYC checks on existing user data
export const performKYCChecks = async (userId) => {
  try {
    const user = await User.findById(userId).select("-password -refreshToken");
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const panData = user.panCard;
    const aadhaarData = user.aadhaarCard;

    if (!panData || !aadhaarData) {
      throw new ApiError(400, "Both PAN and Aadhaar data are required for KYC verification");
    }

    let checks = [];

    // 1. PAN format validation
    const panNumber = panData.pan_number?.replace(/\s+/g, ''); // Remove spaces
    if (validatePANFormat(panNumber)) {
      checks.push({ step: "PAN Format", status: "PASS" });
    } else {
      checks.push({ step: "PAN Format", status: "FAIL" });
    }

    // 2. Aadhaar format validation
    const aadhaarNumber = aadhaarData.aadhaar_number?.replace(/\s+/g, ''); // Remove spaces
    if (validateAadhaarFormat(aadhaarNumber)) {
      checks.push({ step: "Aadhaar Format", status: "PASS" });
    } else {
      checks.push({ step: "Aadhaar Format", status: "FAIL" });
    }

    // 3. Name matching (fuzzy)
    const nameMatch = fuzzyMatch(panData.full_name, aadhaarData.full_name);
    checks.push({
      step: "Name Match",
      status: nameMatch ? "PASS" : "FAIL",
      details: `${panData.full_name} vs ${aadhaarData.full_name}`,
    });

    // 4. DOB consistency
    const dobMatch = panData.date_of_birth === aadhaarData.date_of_birth;
    checks.push({
      step: "DOB Match",
      status: dobMatch ? "PASS" : "FAIL",
      details: `${panData.date_of_birth} vs ${aadhaarData.date_of_birth}`,
    });

    // 5. Address validation (pincode present + format)
    const pinRegex = /^\d{6}$/;
    const addressValid = aadhaarData.address && pinRegex.test(aadhaarData.pin_code);
    checks.push({
      step: "Address Validation",
      status: addressValid ? "PASS" : "FAIL",
      details: aadhaarData.address,
    });

    // 6. Father name consistency (looser check)
    const fatherMatch = fuzzyMatch(
      panData.father_name || "",
      aadhaarData.father_name || "",
      0.6
    );
    checks.push({
      step: "Father Name Match",
      status: fatherMatch ? "PASS" : "FAIL",
      details: `${panData.father_name} vs ${aadhaarData.father_name}`,
    });

    // 7. PAN & Aadhaar linkage (dummy rule, since real API needed)
    // Here you'd normally call NSDL/UIDAI API, but we simulate with rule:
    const linked = true; // placeholder
    checks.push({
      step: "PAN-Aadhaar Linkage",
      status: linked ? "PASS" : "MANUAL_CHECK",
    });

    // Final Decision - Never reject, only approve or pending review
    const criticalFailures = checks.filter(
      c => c.status === "FAIL" && ["PAN Format", "Aadhaar Format"].includes(c.step)
    );
    
    let overall;
    if (criticalFailures.length > 0) {
      overall = "PENDING_REVIEW"; // Instead of REJECTED, send to manual review
    } else if (checks.some(c => c.status === "FAIL")) {
      overall = "PENDING_REVIEW";
    } else {
      overall = "APPROVED";
    }

    // Add additional flags for critical failures requiring manual intervention
    if (criticalFailures.length > 0) {
      checks.push({
        step: "Manual Review Required",
        status: "MANUAL_CHECK",
        details: "Critical document format issues detected - requires manual verification"
      });
    }

    // Update user's KYC status in database
    const kycResult = {
      overall_status: overall,
      checks,
      performed_at: new Date(),
    };

    await User.findByIdAndUpdate(userId, {
      "kycVerification": kycResult,
      "aadhaarCard.verified": overall === "APPROVED",
      "panCard.verified": overall === "APPROVED",
    });

    return kycResult;
  } catch (error) {
    console.error("KYC Check Error:", error);
    throw error;
  }
};

// API endpoint to manually trigger KYC checks
export const performKYC = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const kycResult = await performKYCChecks(userId);

    return res.status(200).json(
      new ApiResponse(
        200,
        kycResult,
        "KYC verification completed successfully"
      )
    );
  } catch (error) {
    console.error("KYC API Error:", error);
    throw new ApiError(500, `KYC check failed: ${error.message}`);
  }
});

// API endpoint to get KYC status
export const getKYCStatus = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const user = await User.findById(userId).select("kycVerification aadhaarCard.verified panCard.verified");
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          kycVerification: user.kycVerification,
          aadhaarVerified: user.aadhaarCard?.verified || false,
          panVerified: user.panCard?.verified || false,
        },
        "KYC status retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Get KYC Status Error:", error);
    throw new ApiError(500, `Failed to get KYC status: ${error.message}`);
  }
});
