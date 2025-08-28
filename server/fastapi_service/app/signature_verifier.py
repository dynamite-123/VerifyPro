from typing import Tuple
from pydantic_ai import Agent, BinaryContent
from pydantic_ai.models.gemini import GeminiModel
from pydantic_ai.providers.google_gla import GoogleGLAProvider
from pydantic import BaseModel
import os


class APIQuotaExceededException(Exception):
    """Exception raised when API quota is exceeded."""
    pass


class SignatureVerifier:
    """AI-based signature verification using Gemini"""
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        self.model = GeminiModel(
            "gemini-2.0-flash-lite",
            provider=GoogleGLAProvider(api_key=api_key),
        )
    
    async def verify_signatures(self, image1_bytes: bytes, image2_bytes: bytes) -> Tuple[float, bool, str]:
        """
        Verify two signatures using Gemini AI
        
        Args:
            image1_bytes: First signature image as bytes
            image2_bytes: Second signature image as bytes
            
        Returns:
            Tuple[float, bool, str]: (confidence_score, is_match, analysis)
        """
        try:
            class SignatureAnalysis(BaseModel):
                confidence_score: float  # 0.0 to 1.0
                is_match: bool
                analysis: str
                reasoning: str
            
            agent = Agent(
                model=self.model,
                output_type=SignatureAnalysis,
                system_prompt=(
                    'You are an expert forensic handwriting analyst specializing in signature verification. '
                    'Analyze the two signature images provided and determine if they were written by the same person. '
                    'Consider stroke patterns, pressure points, letter formations, spacing, slant, and overall flow. '
                    'Provide a confidence score from 0.0 (completely different) to 1.0 (identical). '
                    'A score above 0.6 typically indicates a match. '
                    'Be thorough in your analysis and explain your reasoning.'
                )
            )
            
            binary_images = [
                BinaryContent(data=image1_bytes, media_type='image/png'),
                BinaryContent(data=image2_bytes, media_type='image/png')
            ]
            
            result = await agent.run([
                'Compare these two signature images. Analyze the handwriting characteristics, stroke patterns, '
                'letter formations, spacing, slant, and overall signature flow. Determine if they are from the same person. '
                'Provide a confidence score (0.0-1.0) and detailed reasoning for your decision.',
                *binary_images
            ])
            
            output = result.output
            return output.confidence_score, output.is_match, f"{output.analysis} Reasoning: {output.reasoning}"
            
        except Exception as e:
            if "429" in str(e) or "RATE_LIMIT_EXCEEDED" in str(e):
                raise APIQuotaExceededException("API quota exceeded. Please wait a few minutes or upgrade your plan.")
            else:
                raise e
    
    async def verify_signatures_simple(self, image1_bytes: bytes, image2_bytes: bytes) -> float:
        """
        Simple signature verification that returns only the confidence score
        
        Args:
            image1_bytes: First signature image as bytes
            image2_bytes: Second signature image as bytes
            
        Returns:
            float: Confidence score from 0.0 to 1.0
        """
        try:
            confidence_score, _, _ = await self.verify_signatures(image1_bytes, image2_bytes)
            return confidence_score
        except Exception as e:
            print(f"Error in Gemini signature verification: {str(e)}")
            return 0.0
