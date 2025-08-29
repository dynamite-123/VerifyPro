#!/usr/bin/env python3
"""
PDF Vectorizer - Simple processing script
Processes PDFs and stores embeddings in Supabase
"""

import os
import sys

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our vectorizer
from pdf_vectorizer import process_pdfs_folder_main

def main():
    """Process PDFs in the pdfs folder."""
    print("🚀 Processing PDFs...")
    
    # Process all PDFs in the pdfs folder
    success = process_pdfs_folder_main("./pdfs")
    
    if success:
        print("✅ Processing completed successfully!")
    else:
        print("❌ Processing failed. Check your configuration.")

if __name__ == "__main__":
    main()
