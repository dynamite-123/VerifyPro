from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ocr, signature, otp, chatbot

app = FastAPI(
    title="Document OCR & Signature Verification API",
    description="API for extracting information from Indian government documents like Aadhaar and PAN cards, verifying signatures, and detecting OTP from images",
    version="1.0.0"
)

# Allow CORS from local development servers (Next.js)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr.router)
app.include_router(signature.router)
app.include_router(otp.router)
app.include_router(chatbot.router)
