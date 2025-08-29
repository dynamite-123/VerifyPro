-- First, drop the existing table if it exists
DROP TABLE IF EXISTS policy_embeddings;

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table with correct schema
CREATE TABLE policy_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    source_file TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for similarity search
CREATE INDEX policy_embeddings_embedding_idx 
ON policy_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS similarity_search(vector, double precision, integer);
DROP FUNCTION IF EXISTS similarity_search(vector, float, integer);

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
