#!/usr/bin/env python3
"""
Run script for the FastAPI OCR service.
This script starts the FastAPI server with uvicorn.
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    """Start the FastAPI server."""
    # Check if API key is available
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ Error: GEMINI_API_KEY not found in environment variables")
        print("Please create a .env file with your Gemini API key:")
        print("GEMINI_API_KEY=your_api_key_here")
        return
    
    print("🚀 Starting OCR Document Extraction API...")
    print("📋 Supported formats: Images (PNG, JPEG, WEBP) and PDFs")
    print("🔗 API endpoints:")
    print("   - POST /ocr/extract - Extract from images/PDFs")
    print("   - POST /ocr/extract-pdf - PDF-only with custom DPI")
    print("   - GET /ocr/health - Health check")
    print("📖 Documentation will be available at: http://localhost:8000/docs")
    print("-" * 60)
    
    # Start the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )

if __name__ == "__main__":
    main()
