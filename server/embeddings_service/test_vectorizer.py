#!/usr/bin/env python3

import os
import sys
from pathlib import Path

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our vectorizer
from pdf_vectorizer import process_two_pdfs, process_pdf_folder, demo_query_system, setup_supabase_table

def main():
    print("🔧 PDF Vectorizer Test Script")
    print("=" * 50)
    
    # Define PDF paths
    pdf_folder = "./pdfs"
    pdf1_path = os.path.join(pdf_folder, "FATF-Recommendations.pdf")
    pdf2_path = os.path.join(pdf_folder, "RBI-Guidelines.pdf")
    
    # Check if PDFs exist
    if not os.path.exists(pdf1_path):
        print(f"❌ PDF not found: {pdf1_path}")
        return
    if not os.path.exists(pdf2_path):
        print(f"❌ PDF not found: {pdf2_path}")
        return
    
    print(f"📄 Found PDFs:")
    print(f"   1. {pdf1_path}")
    print(f"   2. {pdf2_path}")
    
    # Show Supabase setup instructions
    print("\n📋 First, make sure you've set up Supabase:")
    setup_supabase_table()
    
    # Process the two PDFs
    print(f"\n🚀 Processing PDFs...")
    success = process_two_pdfs(pdf1_path, pdf2_path)
    
    if success:
        print("\n🎉 PDFs processed successfully!")
        
        # Demo some search queries
        print("\n🔍 Testing semantic search...")
        
        sample_queries = [
            "KYC requirements for banks",
            "FATF recommendations on customer identification",
            "RBI guidelines on know your customer",
            "politically exposed persons",
            "suspicious transaction reporting"
        ]
        
        for i, query in enumerate(sample_queries, 1):
            print(f"\n--- Query {i}: {query} ---")
            demo_query_system(query, num_results=2)
            
        print("\n✅ Test completed successfully!")
    else:
        print("\n❌ Failed to process PDFs. Check your AWS credentials and Supabase configuration.")

if __name__ == "__main__":
    main()
