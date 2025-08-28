
from typing import List
from .schemas import OcrExtractedFields
from pydantic_ai import Agent, BinaryContent
from pydantic_ai.models.gemini import GeminiModel
from pydantic_ai.providers.google_gla import GoogleGLAProvider
import fitz  # PyMuPDF
import os

class OcrAgent:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        self.model = GeminiModel(
            "gemini-2.5-flash",  # Use 1.5-flash instead of 2.0-flash (better free tier)
            provider=GoogleGLAProvider(api_key=api_key),
        )

    def convert_pdf_to_images(self, pdf_bytes: bytes) -> List[bytes]:
        """Convert PDF pages to image bytes."""
        images = []
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        try:
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                pix = page.get_pixmap()
                img_data = pix.tobytes("png")
                images.append(img_data)
        finally:
            pdf_document.close()
            
        return images

    async def extract_fields_from_files(self, files_data: List[dict]) -> List[OcrExtractedFields]:
        """Extract fields from mixed file types (images and PDFs)."""
        all_images = []
        
        for file_data in files_data:
            content = file_data['content']
            content_type = file_data['content_type']
            
            if content_type == 'application/pdf':
                # Convert PDF pages to images
                pdf_images = self.convert_pdf_to_images(content)
                all_images.extend(pdf_images)
            else:
                # Direct image file
                all_images.append(content)
        
        # Process all images through OCR
        return await self.extract_fields_from_images(all_images)

    async def extract_fields_from_images(self, images: List[bytes]) -> List[OcrExtractedFields]:
        agent = Agent(
            model=self.model,
            output_type=List[OcrExtractedFields],
            system_prompt=(
                'Extract information from Indian identity documents. '
                'Find: Aadhaar number, PAN number, full name, date of birth, gender, address, phone number, email. '
                'Return null for missing fields.'
            )
        )

        binaryimages = [
            BinaryContent(data=image, media_type='image/png') for image in images
        ]
        
        try:
            result = await agent.run([
                'Extract: aadhaar_number, pan_number, full_name, date_of_birth, gender, address, phone_number, email from each image.',
                *binaryimages
            ])
            return result.output
        except Exception as e:
            if "429" in str(e) or "RATE_LIMIT_EXCEEDED" in str(e):
                raise Exception("API quota exceeded. Please wait a few minutes or upgrade your plan.")
            else:
                raise e