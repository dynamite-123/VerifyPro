from fastapi import APIRouter, UploadFile, File, HTTPException
from ..utils import OcrAgent, APIQuotaExceededException
from ..schemas import OTPExtractedData

router = APIRouter(prefix="/otp", tags=["OTP"])

@router.post("/detect", response_model=OTPExtractedData)
async def detect_otp_from_image(file: UploadFile = File(..., description="Image file containing face and OTP sheet")):
    """
    Extract OTP from an image containing a user's face and a sheet with OTP written on it.
    
    Supports:
    - Image formats: PNG, JPEG, JPG, WEBP
    
    The image should contain:
    - A person's face (for verification context)
    - A sheet/paper with OTP written/printed on it
    
    Returns:
    - otp: The extracted OTP as a string
    - confidence: Confidence level of the extraction (0-1)
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded or invalid file")
    
    # Check file type
    allowed_types = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"File {file.filename} has unsupported type {file.content_type}. Supported types: images (PNG, JPEG, WEBP)"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Initialize OCR agent and extract OTP
        ocr_agent = OcrAgent()
        
        # Extract OTP from the image
        result = await ocr_agent.extract_otp_from_image(content)
        
        if not result.otp:
            raise HTTPException(
                status_code=404, 
                detail="No OTP found in the image. Please ensure the image contains a clear view of a sheet with OTP written on it."
            )
        
        return result
        
    except APIQuotaExceededException as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing image: {str(e)}"
        )
