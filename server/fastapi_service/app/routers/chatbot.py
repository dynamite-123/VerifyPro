import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

from langchain_aws import BedrockEmbeddings
from supabase import create_client, Client
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.credentials import Credentials

from app.schemas import ChatRequest, ChatResponse
from app.chat_utils import retrieve_context, build_prompt, generate_answer

router = APIRouter()

AWS_REGION = os.getenv("AWS_REGION")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
IBM_API_KEY = os.getenv("IBM_API_KEY")
IBM_PROJECT_ID = os.getenv("IBM_PROJECT_ID")
EMBEDDING_MODEL = "amazon.titan-embed-text-v1"
EMBEDDING_DIM = 1536

bedrock_embeddings = BedrockEmbeddings(
	model_id=EMBEDDING_MODEL,
	region_name=AWS_REGION
)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
ibm_credentials = Credentials(
	url="https://us-south.ml.cloud.ibm.com",
	api_key=IBM_API_KEY
)
ibm_model = ModelInference(
	model_id="ibm/granite-13b-instruct-v2",
	credentials=ibm_credentials,
	project_id=IBM_PROJECT_ID
)


@router.post("/chat", response_model=ChatResponse)
async def chat_rag(request: ChatRequest):
	try:
		contexts = retrieve_context(request.query, request.top_k, bedrock_embeddings, supabase)
		if not contexts:
			raise HTTPException(status_code=404, detail="No relevant context found.")
		prompt = build_prompt(request.query, contexts)
		answer = generate_answer(prompt, ibm_model)
		return ChatResponse(answer=answer, context=[c.get('content', '') for c in contexts])
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))
