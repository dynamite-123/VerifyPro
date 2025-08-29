#!/usr/bin/env python3

import os
import sys
from pathlib import Path

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our vectorizer
from pdf_vectorizer import demo_query_system

def main():
    print("🔍 Testing Semantic Search on Processed PDFs")
    print("=" * 50)
    
    # Test queries
    test_queries = [
        "KYC requirements for banks",
        "customer identification procedures",
        "politically exposed persons",
        "anti money laundering",
        "suspicious transaction reporting"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n--- Test Query {i}: {query} ---")
        try:
            demo_query_system(query, num_results=2)
        except Exception as e:
            print(f"Error in query: {e}")
        print("-" * 60)

if __name__ == "__main__":
    main()
