# PDF Embeddings Service

This service processes PDF documents, generates embeddings using AWS Bedrock, and stores them in Supabase for semantic search.

## Purpose

This is a **one-time processing service** designed to:
1. Load PDF documents from the `pdfs/` folder
2. Split them into chunks using LangChain
3. Generate embeddings using AWS Bedrock Titan
4. Store embeddings in Supabase for semantic search

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment variables** (in `.env`):
   - AWS credentials for Bedrock
   - Supabase URL and API key

3. **Setup Supabase database:**
   - Run the SQL from `setup_supabase.sql` in your Supabase SQL editor

## Usage

### Process PDFs (One-time)
```bash
python3 app.py
```

This will:
- Process all PDFs in the `pdfs/` folder
- Generate and store embeddings
- Demonstrate search functionality

### Test Individual Components
```bash
# Test AWS and Supabase connections
python3 test_components.py

# Test semantic search
python3 test_direct_search.py

# Process specific PDFs
python3 test_vectorizer.py
```

## Files

- `pdf_vectorizer.py` - Main vectorization logic
- `app.py` - One-time processing script
- `test_*.py` - Various test scripts
- `setup_supabase.sql` - Database setup SQL
- `pdfs/` - Input PDF documents
- `.env` - Environment configuration

## Current Status

✅ **Ready to use!** The service has successfully processed:
- FATF-Recommendations.pdf (459 chunks)
- RBI-Guidelines.pdf (140 chunks)
- Total: 599 searchable document chunks stored in Supabase
