#!/usr/bin/env python3

import os
import sys
from pathlib import Path

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our vectorizer
from pdf_vectorizer import supabase, embeddings

def test_direct_search():
    """Test search using the RPC function directly."""
    print("🔍 Testing Direct RPC Search")
    print("=" * 40)
    
    try:
        # Test query
        query = "KYC requirements for banks"
        print(f"Query: {query}")
        
        # Generate embedding for query
        query_embedding = embeddings.embed_query(query)
        print(f"Query embedding generated: {len(query_embedding)} dimensions")
        
        # Use RPC function
        response = supabase.rpc(
            "similarity_search",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.6,
                "match_count": 3
            }
        ).execute()
        
        print(f"RPC Response: {len(response.data) if response.data else 0} results")
        
        if response.data:
            for i, result in enumerate(response.data, 1):
                print(f"\n📄 Result {i}:")
                print(f"   Source: {result.get('source_file', 'Unknown')}")
                print(f"   Similarity: {result.get('similarity', 'N/A'):.4f}")
                content = result.get('content', '')
                preview = content[:200] + "..." if len(content) > 200 else content
                print(f"   Content: {preview}")
        else:
            print("No results found")
            
    except Exception as e:
        print(f"Error: {e}")

def check_database_stats():
    """Check basic database statistics."""
    print("\n📊 Database Statistics")
    print("=" * 30)
    
    try:
        # Count total records
        count_response = supabase.table("policy_embeddings").select("id", count="exact").execute()
        print(f"Total records: {count_response.count}")
        
        # Check sources
        sources_response = supabase.table("policy_embeddings").select("source_file").execute()
        sources = set(record['source_file'] for record in sources_response.data)
        print(f"Source files: {sources}")
        
    except Exception as e:
        print(f"Error checking stats: {e}")

if __name__ == "__main__":
    check_database_stats()
    test_direct_search()
