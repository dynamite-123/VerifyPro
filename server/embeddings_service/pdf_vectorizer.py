import os
import json
import uuid
from typing import List, Dict, Tuple
import numpy as np
from pathlib import Path

# LangChain imports
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_aws import BedrockEmbeddings
from langchain.schema import Document

# AWS Bedrock
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

# Supabase
from supabase import create_client, Client

# Environment variables
from dotenv import load_dotenv
load_dotenv()

print("All libraries imported successfully!")

# AWS Configuration - Load from environment variables
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# Supabase Configuration - Load from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

# Configuration
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 100
EMBEDDING_MODEL = "amazon.titan-embed-text-v1"
EMBEDDING_DIMENSION = 1536

# Set AWS credentials
if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    os.environ["AWS_ACCESS_KEY_ID"] = AWS_ACCESS_KEY_ID
    os.environ["AWS_SECRET_ACCESS_KEY"] = AWS_SECRET_ACCESS_KEY
    os.environ["AWS_DEFAULT_REGION"] = AWS_REGION
    print("AWS credentials loaded from environment variables")
else:
    print("WARNING: AWS credentials not found in environment variables!")
    print("Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file")

# Validate Supabase configuration
if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase configuration not found in environment variables!")
    print("Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")
else:
    print("Supabase configuration loaded from environment variables")

print("Configuration loaded successfully!")

# Initialize services
try:
    # Initialize text splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    # Initialize Bedrock embeddings (only if AWS credentials are available)
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        # Configure Bedrock with longer timeouts
        bedrock_config = Config(
            read_timeout=300,  # 5 minutes
            connect_timeout=60,  # 1 minute
            retries={'max_attempts': 3}
        )
        
        embeddings = BedrockEmbeddings(
            model_id=EMBEDDING_MODEL,
            region_name=AWS_REGION,
            config=bedrock_config
        )
        print("Bedrock embeddings initialized successfully!")
    else:
        embeddings = None
        print("Bedrock embeddings not initialized - AWS credentials missing")
    
    # Initialize Supabase client (only if configuration is available)
    if SUPABASE_URL and SUPABASE_KEY:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase client initialized successfully!")
    else:
        supabase = None
        print("Supabase client not initialized - configuration missing")
    
    print("Service initialization completed!")
except Exception as e:
    print(f"Error initializing services: {e}")

def verify_aws_connection():
    """Verify AWS connection."""
    try:
        sts = boto3.client("sts")
        identity = sts.get_caller_identity()
        print(f"AWS Connection verified. Account: {identity.get('Account')}")
        return True
    except Exception as e:
        print(f"AWS connection failed: {e}")
        return False

def load_and_split_pdf(pdf_path: str) -> List[Document]:
    """Load and split PDF using LangChain."""
    try:
        loader = PyPDFLoader(pdf_path)
        pages = loader.load()
        print(f"Loaded {len(pages)} pages from {Path(pdf_path).name}")
        
        documents = text_splitter.split_documents(pages)
        print(f"Split into {len(documents)} chunks")
        
        for doc in documents:
            doc.metadata["source_file"] = Path(pdf_path).name
        
        return documents
    except Exception as e:
        print(f"Error loading PDF {pdf_path}: {str(e)}")
        return []

def generate_embeddings_batch(documents: List[Document]) -> List[Tuple[Document, List[float]]]:
    """Generate embeddings for documents using LangChain with smaller batches."""
    try:
        if not embeddings:
            print("Error: Embeddings service not initialized. Check AWS credentials.")
            return []
            
        texts = [doc.page_content for doc in documents]
        print(f"Generating embeddings for {len(texts)} text chunks...")
        
        # Process in smaller batches to avoid timeouts
        batch_size = 20  # Reduced from default
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            batch_docs = documents[i:i + batch_size]
            
            print(f"Processing batch {i//batch_size + 1}/{(len(texts) + batch_size - 1)//batch_size} ({len(batch_texts)} texts)")
            
            try:
                # Generate embeddings for this batch
                batch_embeddings = embeddings.embed_documents(batch_texts)
                
                # Combine documents with their embeddings
                for doc, embedding in zip(batch_docs, batch_embeddings):
                    all_embeddings.append((doc, embedding))
                    
                print(f"✓ Batch {i//batch_size + 1} completed successfully")
                
            except Exception as e:
                print(f"✗ Error in batch {i//batch_size + 1}: {e}")
                # Try individual embeddings for this batch
                print("Trying individual embeddings for failed batch...")
                for j, (doc, text) in enumerate(zip(batch_docs, batch_texts)):
                    try:
                        individual_embedding = embeddings.embed_query(text)
                        all_embeddings.append((doc, individual_embedding))
                        print(f"  ✓ Individual embedding {j+1}/{len(batch_texts)} completed")
                    except Exception as e2:
                        print(f"  ✗ Individual embedding {j+1} failed: {e2}")
                        continue
        
        print(f"Successfully generated {len(all_embeddings)} embeddings out of {len(documents)} documents")
        return all_embeddings
        
    except Exception as e:
        print(f"Error generating embeddings: {str(e)}")
        return []

def store_documents_in_supabase(doc_embeddings: List[Tuple[Document, List[float]]]):
    """Store documents and embeddings in Supabase."""
    try:
        if not supabase:
            print("Error: Supabase client not initialized. Check configuration.")
            return
            
        records = []
        for doc, embedding in doc_embeddings:
            # Create a simplified record structure without page_number
            record = {
                "id": str(uuid.uuid4()),
                "content": doc.page_content,
                "embedding": embedding,
                "source_file": doc.metadata.get("source_file", "unknown"),
                "metadata": json.dumps(doc.metadata)
            }
            records.append(record)
        
        # Insert in batches
        batch_size = 10
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            try:
                response = supabase.table("policy_embeddings").insert(batch).execute()
                print(f"Inserted batch {i//batch_size + 1}: {len(batch)} records")
            except Exception as e:
                print(f"Error inserting batch {i//batch_size + 1}: {e}")
                # Try inserting records one by one to identify the issue
                for j, record in enumerate(batch):
                    try:
                        response = supabase.table("policy_embeddings").insert(record).execute()
                        print(f"✓ Inserted individual record {j+1} from batch {i//batch_size + 1}")
                    except Exception as e2:
                        print(f"✗ Failed to insert record {j+1}: {e2}")
        
        print(f"Successfully processed {len(records)} documents")
    except Exception as e:
        print(f"Error storing documents: {e}")

def semantic_search(query: str, limit: int = 3) -> List[Dict]:
    """Perform semantic search using embeddings."""
    try:
        if not embeddings:
            print("Error: Embeddings service not initialized. Check AWS credentials.")
            return []
            
        if not supabase:
            print("Error: Supabase client not initialized. Check configuration.")
            return []
            
        query_embedding = embeddings.embed_query(query)
        
        # Try RPC function first
        try:
            response = supabase.rpc(
                "similarity_search",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": 0.7,
                    "match_count": limit
                }
            ).execute()
            if response.data:
                return response.data
        except:
            pass
        
        # Fallback method
        all_embeddings = supabase.table("policy_embeddings").select("*").limit(1000).execute()
        if not all_embeddings.data:
            return []
        
        query_vec = np.array(query_embedding)
        similarities = []
        
        for record in all_embeddings.data:
            embedding_vec = np.array(record['embedding'])
            similarity = np.dot(query_vec, embedding_vec) / (
                np.linalg.norm(query_vec) * np.linalg.norm(embedding_vec)
            )
            similarities.append((similarity, record))
        
        similarities.sort(key=lambda x: x[0], reverse=True)
        results = []
        for similarity, record in similarities[:limit]:
            result = record.copy()
            result['similarity'] = float(similarity)
            results.append(result)
        
        return results
    except Exception as e:
        print(f"Error in semantic search: {e}")
        return []

def process_two_pdfs(pdf_path1: str, pdf_path2: str) -> bool:
    """Process two PDF documents and store their embeddings."""
    try:
        print("=== Processing Two PDFs ===")
        
        # Verify AWS connection
        if not verify_aws_connection():
            return False
        
        # Process first PDF
        print(f"\n--- Processing PDF 1: {Path(pdf_path1).name} ---")
        documents1 = load_and_split_pdf(pdf_path1)
        if not documents1:
            print(f"Failed to load {pdf_path1}")
            return False
        
        # Process second PDF
        print(f"\n--- Processing PDF 2: {Path(pdf_path2).name} ---")
        documents2 = load_and_split_pdf(pdf_path2)
        if not documents2:
            print(f"Failed to load {pdf_path2}")
            return False
        
        # Combine documents
        all_documents = documents1 + documents2
        print(f"\nTotal documents to process: {len(all_documents)}")
        
        # Generate embeddings for all documents
        print("\n--- Generating Embeddings ---")
        doc_embeddings = generate_embeddings_batch(all_documents)
        if not doc_embeddings:
            print("Failed to generate embeddings")
            return False
        
        # Store in Supabase
        print("\n--- Storing in Supabase ---")
        store_documents_in_supabase(doc_embeddings)
        
        print("✅ Successfully processed both PDFs!")
        return True
        
    except Exception as e:
        print(f"❌ Error processing PDFs: {e}")
        return False

def process_single_pdf(pdf_path: str) -> bool:
    """Complete pipeline to process a PDF document."""
    try:
        print(f"\n=== Processing {Path(pdf_path).name} ===")
        
        # Verify AWS connection
        if not verify_aws_connection():
            return False
        
        # Load and split PDF
        documents = load_and_split_pdf(pdf_path)
        if not documents:
            return False
        
        # Generate embeddings
        doc_embeddings = generate_embeddings_batch(documents)
        if not doc_embeddings:
            return False
        
        # Store in Supabase
        store_documents_in_supabase(doc_embeddings)
        
        print(f"✅ Successfully processed {Path(pdf_path).name}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def process_pdf_folder(folder_path: str):
    """Process all PDF files in a folder."""
    folder = Path(folder_path)
    if not folder.exists():
        print(f"Folder {folder_path} does not exist")
        return
    
    pdf_files = list(folder.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {folder_path}")
        return
    
    print(f"Found {len(pdf_files)} PDF files")
    
    successful = 0
    for pdf_file in pdf_files:
        if process_single_pdf(str(pdf_file)):
            successful += 1
    
    print(f"\n=== Summary ===\nSuccessful: {successful}/{len(pdf_files)}")

def demo_query_system(query: str, num_results: int = 3):
    """Demo the semantic search system."""
    print(f"\n🔍 Query: '{query}'")
    print(f"Looking for {num_results} most relevant sections...\n")
    
    results = semantic_search(query, limit=num_results)
    
    if not results:
        print("❌ No results found. Process some PDFs first!")
        return
    
    for i, result in enumerate(results, 1):
        print(f"📄 Result {i}:")
        print(f"   Source: {result.get('source_file', 'Unknown')}")
        print(f"   Page: {result.get('page_number', 'N/A')}")
        
        if 'similarity' in result:
            print(f"   Similarity: {result['similarity']:.4f}")
        
        content = result.get('content', '')
        preview = content[:300] + "..." if len(content) > 300 else content
        print(f"   Content: {preview}")
        print("─" * 60)

def setup_supabase_table():
    """Print SQL setup instructions for Supabase."""
    sql_setup = """
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table (simplified schema)
CREATE TABLE IF NOT EXISTS policy_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    source_file TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for similarity search
CREATE INDEX IF NOT EXISTS policy_embeddings_embedding_idx 
ON policy_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create similarity search function
CREATE OR REPLACE FUNCTION similarity_search(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    source_file TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    similarity FLOAT
)
LANGUAGE SQL
AS $$
    SELECT 
        id, content, source_file, metadata, created_at,
        1 - (embedding <=> query_embedding) AS similarity
    FROM policy_embeddings
    WHERE 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;
"""
    
    print("=== Supabase Setup Instructions ===")
    print("Copy and run the following SQL in your Supabase SQL editor:")
    print(sql_setup)

def process_pdfs_folder_main(folder_path="./pdfs"):
    """Main function to process PDFs in the specified folder."""
    print("PDF Vectorizer with LangChain and Supabase")
    print("==========================================")
    
    # Print setup instructions
    setup_supabase_table()
    
    # Check if folder exists
    if not os.path.exists(folder_path):
        print(f"❌ Folder not found: {folder_path}")
        return False
    
    # Process all PDFs in the folder
    print(f"\n🚀 Processing all PDFs in: {folder_path}")
    process_pdf_folder(folder_path)
    
    return True

# Main execution example
if __name__ == "__main__":
    # Process PDFs in the pdfs folder
    process_pdfs_folder_main("./pdfs")
