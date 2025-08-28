
from typing import List
from .schemas import AadhaarExtractedData, PANExtractedData
from pydantic_ai import Agent, BinaryContent
from pydantic_ai.models.gemini import GeminiModel
from pydantic_ai.providers.google_gla import GoogleGLAProvider
import fitz  # PyMuPDF
import os

class APIQuotaExceededException(Exception):
    """Exception raised when API quota is exceeded."""
    pass

class OcrAgent:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        self.model = GeminiModel(
            "gemini-2.0-flash-lite",  # Use Gemini 2.0 Flash Lite
            provider=GoogleGLAProvider(api_key=api_key),
        )

    def convert_pdf_to_images(self, pdf_bytes: bytes, dpi: int = 150) -> List[bytes]:
        """Convert PDF pages to image bytes."""
        images = []
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        try:
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                # Calculate matrix for DPI scaling
                zoom = dpi / 72.0  # 72 is the default DPI
                mat = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=mat)
                img_data = pix.tobytes("png")
                images.append(img_data)
        finally:
            pdf_document.close()
            
        return images

    async def extract_aadhaar_data(self, images: List[bytes]) -> List[AadhaarExtractedData]:
        """Extract data specifically from Aadhaar cards."""
        agent = Agent(
            model=self.model,
            output_type=List[AadhaarExtractedData],
            system_prompt=(
                'Extract information from Indian Aadhaar cards only. '
                'Aadhaar cards have a 12-digit unique identification number, photo, and demographic details. '
                'The card has Government of India logo and "Government of India" text. '
                'Look for: Aadhaar number (12 digits), name, date of birth, gender, address, PIN code, father\'s name. '
                'Return null for missing fields. Be very accurate with the Aadhaar number format (12 digits).'
            )
        )

        binaryimages = [
            BinaryContent(data=image, media_type='image/png') for image in images
        ]
        
        try:
            result = await agent.run([
                'Extract Aadhaar card data: aadhaar_number (12 digits), full_name, date_of_birth, gender, address, father_name, phone_number, email, pin_code, state, district from each Aadhaar card image.',
                *binaryimages
            ])
            return result.output
        except Exception as e:
            if "429" in str(e) or "RATE_LIMIT_EXCEEDED" in str(e):
                raise APIQuotaExceededException("API quota exceeded. Please wait a few minutes or upgrade your plan.")
            else:
                raise e

    async def extract_pan_data(self, images: List[bytes]) -> List[PANExtractedData]:
        """Extract data specifically from PAN cards."""
        agent = Agent(
            model=self.model,
            output_type=List[PANExtractedData],
            system_prompt=(
                'Extract information from Indian PAN (Permanent Account Number) cards only. '
                'PAN cards have a 10-character alphanumeric PAN number in format AAAAA9999A, photo, and personal details. '
                'The card has "INCOME TAX DEPARTMENT GOVT. OF INDIA" header and Indian flag/emblem. '
                'Look for: PAN number (10 characters), name, father\'s name, date of birth, signature, photo. '
                'Return null for missing fields. Be very accurate with the PAN number format (5 letters + 4 digits + 1 letter).'
            )
        )

        binaryimages = [
            BinaryContent(data=image, media_type='image/png') for image in images
        ]
        
        try:
            result = await agent.run([
                'Extract PAN card data: pan_number (format AAAAA9999A), full_name, father_name, date_of_birth, signature_present (boolean), photo_present (boolean), permanent_account_number from each PAN card image.',
                *binaryimages
            ])
            return result.output
        except Exception as e:
            if "429" in str(e) or "RATE_LIMIT_EXCEEDED" in str(e):
                raise APIQuotaExceededException("API quota exceeded. Please wait a few minutes or upgrade your plan.")
            else:
                raise e