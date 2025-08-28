from fastapi import FastAPI
from app.routers import ocr

app = FastAPI(
    title="Document OCR API",
    description="API for extracting information from Indian government documents like Aadhaar and PAN cards",
    version="1.0.0"
)

app.include_router(ocr.router)
