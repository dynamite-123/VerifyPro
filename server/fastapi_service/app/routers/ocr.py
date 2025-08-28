from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import List
from ..utils import OcrAgent, APIQuotaExceededException
from ..schemas import AadhaarExtractedData, PANExtractedData

router = APIRouter(prefix="/ocr", tags=["OCR"])

@router.get("/health")
async def health_check():
    """Health check endpoint for the OCR service."""
    return {"status": "healthy", "service": "OCR Document Extraction"}


@router.get("/test-gemini")
async def test_gemini_endpoint():
    """Test endpoint to verify Gemini API integration is working."""
    try:
        from ..utils import OcrAgent
        import os
        
        # Get the region being used (note: may not be directly supported by provider)
        region = os.getenv("GEMINI_REGION", "us-central1")
        
        # Initialize OCR agent (which sets up Gemini)
        ocr_agent = OcrAgent()
        
        # Create a simple agent to test text-only queries
        from pydantic_ai import Agent
        from pydantic import BaseModel
        
        class PlanetResponse(BaseModel):
            question: str
            answer: str
            planet_count: int
        
        agent = Agent(
            model=ocr_agent.model,
            output_type=PlanetResponse,
            system_prompt='You are a helpful astronomy assistant. Answer questions about the solar system accurately.'
        )
        
        result = await agent.run('How many planets are there in our solar system? Provide the exact number and a brief explanation.')
        
        return {
            "status": "success",
            "region_configured": region,
            "gemini_response": result.output,
            "message": f"Gemini API is working correctly (region configured: {region}, but may use default routing)",
            "note": "Region setting may not be directly supported by current pydantic-ai version"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Gemini API test failed: {str(e)}"
        )


@router.post("/extract-aadhaar", response_model=List[AadhaarExtractedData])
async def extract_aadhaar_data(files: List[UploadFile] = File(...)):
    """
    Extract data specifically from Aadhaar card images or PDFs.
    
    Supports:
    - Image formats: PNG, JPEG, JPG, WEBP
    - PDF documents (each page will be processed separately)
    - Multiple file uploads for batch processing
    
    Extracted Aadhaar fields:
    - Aadhaar Number (12-digit unique ID)
    - Full Name
    - Date of Birth
    - Gender (Male/Female/Transgender)
    - Complete Address with PIN code
    - Father's/Husband's Name
    - Phone Number (if available)
    - Email Address (if available)
    - PIN Code (6-digit)
    - State and District
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    allowed_types = {
        "image/png", "image/jpeg", "image/jpg", "image/webp", 
        "application/pdf"
    }
    for file in files:
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"File {file.filename} has unsupported type {file.content_type}. Supported types: images (PNG, JPEG, WEBP) and PDF"
            )
    
    try:
        # Read file contents and prepare data
        files_data = []
        for file in files:
            content = await file.read()
            files_data.append({
                'content': content,
                'content_type': file.content_type,
                'filename': file.filename
            })
        
        # Initialize OCR agent and extract Aadhaar data
        ocr_agent = OcrAgent()
        
        # Convert files to images
        all_images = []
        for file_data in files_data:
            content = file_data['content']
            content_type = file_data['content_type']
            
            if content_type == 'application/pdf':
                pdf_images = ocr_agent.convert_pdf_to_images(content)
                all_images.extend(pdf_images)
            else:
                all_images.append(content)
        
        # Extract Aadhaar data
        extracted_data = await ocr_agent.extract_aadhaar_data(all_images)
        return extracted_data
    
    except APIQuotaExceededException as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing Aadhaar documents: {str(e)}")


@router.post("/extract-pan", response_model=List[PANExtractedData])
async def extract_pan_data(files: List[UploadFile] = File(...)):
    """
    Extract data specifically from PAN card images or PDFs.
    
    Supports:
    - Image formats: PNG, JPEG, JPG, WEBP
    - PDF documents (each page will be processed separately)
    - Multiple file uploads for batch processing
    
    Extracted PAN fields:
    - PAN Number (10-character alphanumeric in format AAAAA9999A)
    - Full Name
    - Father's Name
    - Date of Birth
    - Signature Present (boolean)
    - Photo Present (boolean)
    - Permanent Account Number (if different from PAN number)
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    # Validate file types
    allowed_types = {
        "image/png", "image/jpeg", "image/jpg", "image/webp", 
        "application/pdf"
    }
    for file in files:
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"File {file.filename} has unsupported type {file.content_type}. Supported types: images (PNG, JPEG, WEBP) and PDF"
            )
    
    try:
        # Read file contents and prepare data
        files_data = []
        for file in files:
            content = await file.read()
            files_data.append({
                'content': content,
                'content_type': file.content_type,
                'filename': file.filename
            })
        
        # Initialize OCR agent and extract PAN data
        ocr_agent = OcrAgent()
        
        # Convert files to images
        all_images = []
        for file_data in files_data:
            content = file_data['content']
            content_type = file_data['content_type']
            
            if content_type == 'application/pdf':
                pdf_images = ocr_agent.convert_pdf_to_images(content)
                all_images.extend(pdf_images)
            else:
                all_images.append(content)
        
        # Extract PAN data
        extracted_data = await ocr_agent.extract_pan_data(all_images)
        return extracted_data
    
    except APIQuotaExceededException as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PAN documents: {str(e)}")
