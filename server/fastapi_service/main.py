from fastapi import FastAPI
from app.routers import ocr, signature, otp, chatbot

app = FastAPI(
    title="Document OCR & Signature Verification API",
    description="API for extracting information from Indian government documents like Aadhaar and PAN cards, verifying signatures, and detecting OTP from images",
    version="1.0.0"
)

app.include_router(ocr.router)
app.include_router(signature.router)
app.include_router(otp.router)
app.include_router(chatbot.router)
