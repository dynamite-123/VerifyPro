from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import List
from ..utils import OcrAgent
from ..schemas import OcrExtractedFields

router = APIRouter(prefix="/ocr", tags=["OCR"])

@router.post("/extract", response_model=List[OcrExtractedFields])
async def extract_document_fields(files: List[UploadFile] = File(...)):
    """
    Extract Aadhaar number, PAN number, address, full name, date of birth, 
    gender, phone number, and email from uploaded document images or PDFs.
    
    Supports:
    - Image formats: PNG, JPEG, JPG, WEBP
    - PDF documents (each page will be processed separately)
    - Multiple file uploads for batch processing
    
    Extracted fields:
    - Aadhaar Number (12-digit ID)
    - PAN Number (10-character alphanumeric)
    - Full Name
    - Date of Birth
    - Gender
    - Address (complete with PIN code)
    - Phone Number (10-digit Indian mobile numbers)
    - Email Address
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
        
        # Initialize OCR agent and extract fields
        ocr_agent = OcrAgent()
        extracted_data = await ocr_agent.extract_fields_from_files(files_data)
        
        return extracted_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing documents: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint for the OCR service."""
    return {"status": "healthy", "service": "OCR Document Extraction"}


@router.post("/extract-pdf", response_model=List[OcrExtractedFields])
async def extract_pdf_fields(
    file: UploadFile = File(...),
    dpi: int = Query(150, ge=72, le=300, description="DPI for PDF to image conversion (higher = better quality)")
):
    """
    Extract fields from a PDF document with custom DPI settings.
    Each page of the PDF will be processed separately.
    
    Args:
        file: PDF file to process
        dpi: Resolution for PDF to image conversion (72-300, default 150)
    """
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400, 
            detail=f"File must be a PDF. Received: {file.content_type}"
        )
    
    try:
        content = await file.read()
        
        # Initialize OCR agent
        ocr_agent = OcrAgent()
        
        # Convert PDF to images with specified DPI
        pdf_images = ocr_agent.convert_pdf_to_images(content, dpi=dpi)
        
        # Extract fields from all pages
        extracted_data = await ocr_agent.extract_fields_from_images(pdf_images)
        
        return extracted_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
