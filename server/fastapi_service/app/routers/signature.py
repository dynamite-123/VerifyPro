from fastapi import APIRouter, UploadFile, File, HTTPException
from ..signature_verifier import SignatureVerifier, APIQuotaExceededException

router = APIRouter(prefix="/signature", tags=["Signature Verification"])


@router.post("/verify")
async def verify_signatures_simple_endpoint(
    signature1: UploadFile = File(..., description="First signature image"),
    signature2: UploadFile = File(..., description="Second signature image")
):
    """
    Simple signature verification endpoint that returns only the accuracy score.
    
    Args:
        signature1: First signature image file
        signature2: Second signature image file
        
    Returns:
        Dictionary with accuracy score
    """
    try:
        # Validate file types
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/bmp"]
        
        if signature1.content_type not in allowed_types or signature2.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Allowed: JPG, PNG, BMP"
            )
        
        # Read image bytes
        image1_bytes = await signature1.read()
        image2_bytes = await signature2.read()
        
        # Use signature verifier
        verifier = SignatureVerifier()
        accuracy = await verifier.verify_signatures_simple(image1_bytes, image2_bytes)
        
        # Determine if signatures match (threshold: 0.6)
        is_match = accuracy >= 0.6
        result = "matched" if is_match else "unmatched"
        
        return {
            "result": result,
            "accuracy_score": round(accuracy, 4)
        }
        
    except APIQuotaExceededException as e:
        raise HTTPException(status_code=429, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing signature verification: {str(e)}"
        )