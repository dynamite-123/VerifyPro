from fastapi import FastAPI
from app.routers import ocr, signature

app = FastAPI(
    title="Document OCR & Signature Verification API",
    description="API for extracting information from Indian government documents like Aadhaar and PAN cards, and verifying signatures",
    version="1.0.0"
)

app.include_router(ocr.router)
app.include_router(signature.router)
