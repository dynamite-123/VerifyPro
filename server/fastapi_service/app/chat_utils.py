import numpy as np
from typing import List

def retrieve_context(query: str, top_k: int, bedrock_embeddings, supabase) -> List[dict]:
    query_embedding = bedrock_embeddings.embed_query(query)
    try:
        response = supabase.rpc(
            "similarity_search",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.7,
                "match_count": top_k
            }
        ).execute()
        if response.data:
            return response.data
    except Exception:
        pass
    all_embeddings = supabase.table("policy_embeddings").select("*").limit(1000).execute()
    if not all_embeddings.data:
        return []
    query_vec = np.array(query_embedding, dtype=np.float32)
    scored = []
    for record in all_embeddings.data:
        try:
            # Ensure embedding is properly converted to float array
            emb_data = record["embedding"]
            if isinstance(emb_data, str):
                # If it's a string, try to parse it as JSON array
                import json
                emb_data = json.loads(emb_data)
            emb = np.array(emb_data, dtype=np.float32)
            
            # Calculate cosine similarity
            sim = float(np.dot(query_vec, emb) / (np.linalg.norm(query_vec) * np.linalg.norm(emb)))
            scored.append((sim, record))
        except (ValueError, TypeError, json.JSONDecodeError) as e:
            # Skip records with invalid embeddings
            print(f"Skipping record with invalid embedding: {e}")
            continue
    scored.sort(key=lambda x: x[0], reverse=True)
    return [r for _, r in scored[:top_k]]

def build_prompt(query: str, contexts: List[dict]) -> str:
    context_str = "\n\n".join([f"Source: {c.get('source_file', '')}\nContent: {c.get('content', '')}" for c in contexts])
    prompt = f"""You are a knowledgeable financial compliance expert. Based on the provided context from regulatory documents, provide a comprehensive and detailed answer to the user's question. 

Include specific requirements, procedures, and any relevant guidelines mentioned in the context. Structure your response with clear explanations and cite the relevant source documents when applicable.

Context:
{context_str}

Question: {query}

Please provide a detailed answer that thoroughly addresses the question using the information from the context above:"""
    return prompt

def generate_answer(prompt: str, ibm_model) -> str:
    response = ibm_model.generate(
        prompt=prompt,
    )
    return response['results'][0]['generated_text']
