from pydantic import BaseModel
from typing import Optional

class AadhaarExtractedData(BaseModel):
    aadhaar_number: Optional[str] = None  # 12-digit Aadhaar number
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None  # Male/Female/Transgender
    address: Optional[str] = None  # Complete address with PIN code
    father_name: Optional[str] = None  # Father's/Husband's name
    phone_number: Optional[str] = None  # Mobile number if available
    email: Optional[str] = None  # Email if available
    pin_code: Optional[str] = None  # 6-digit PIN code
    state: Optional[str] = None
    district: Optional[str] = None

class PANExtractedData(BaseModel):
    pan_number: Optional[str] = None  # 10-character PAN number (format: AAAAA9999A)
    full_name: Optional[str] = None
    father_name: Optional[str] = None  # Father's name
    date_of_birth: Optional[str] = None
    signature_present: Optional[bool] = None  # Whether signature is present on card
    photo_present: Optional[bool] = None  # Whether photo is present on card
    permanent_account_number: Optional[str] = None  # Same as pan_number but full text if different

class OTPExtractedData(BaseModel):
    otp: Optional[str] = None  # The extracted OTP from the image
    confidence: Optional[float] = None  # Confidence level of the extraction (0-1)
