#!/usr/bin/env python3

import os
import sys
import json
import uuid
from pathlib import Path

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our vectorizer
from pdf_vectorizer import supabase, embeddings

def test_supabase_connection():
    """Test basic Supabase connection and operations."""
    print("🔧 Testing Supabase Connection")
    print("=" * 40)
    
    try:
        # Test 1: Check if we can connect to Supabase
        print("1. Testing Supabase connection...")
        response = supabase.table("policy_embeddings").select("count").execute()
        print(f"✓ Connected to Supabase successfully")
        
        # Test 2: Insert a simple test record
        print("2. Testing record insertion...")
        test_record = {
            "id": str(uuid.uuid4()),
            "content": "This is a test document for embedding storage.",
            "embedding": [0.1] * 1536,  # Simple test embedding
            "source_file": "test.pdf",
            "metadata": json.dumps({"test": True})
        }
        
        insert_response = supabase.table("policy_embeddings").insert(test_record).execute()
        print(f"✓ Test record inserted successfully")
        test_id = test_record["id"]
        
        # Test 3: Retrieve the record
        print("3. Testing record retrieval...")
        select_response = supabase.table("policy_embeddings").select("*").eq("id", test_id).execute()
        if select_response.data:
            print(f"✓ Test record retrieved successfully")
            print(f"  Content: {select_response.data[0]['content']}")
        
        # Test 4: Clean up - delete the test record
        print("4. Cleaning up test record...")
        delete_response = supabase.table("policy_embeddings").delete().eq("id", test_id).execute()
        print(f"✓ Test record deleted successfully")
        
        print("\n🎉 All Supabase tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Supabase test failed: {e}")
        print("Make sure you've set up the Supabase table with the correct schema.")
        return False

def test_embeddings():
    """Test embedding generation."""
    print("\n🔧 Testing Embeddings")
    print("=" * 40)
    
    try:
        print("1. Testing embedding generation...")
        test_text = "This is a test document for KYC compliance."
        embedding = embeddings.embed_query(test_text)
        print(f"✓ Generated embedding of length: {len(embedding)}")
        print(f"  First 5 values: {embedding[:5]}")
        
        print("\n🎉 Embedding test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Embedding test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 PDF Vectorizer Component Tests")
    print("=" * 50)
    
    # Test embeddings first
    embeddings_ok = test_embeddings()
    
    # Test Supabase
    supabase_ok = test_supabase_connection()
    
    if embeddings_ok and supabase_ok:
        print("\n✅ All tests passed! Your vectorizer is ready to process PDFs.")
    else:
        print("\n❌ Some tests failed. Please check your configuration.")
