# VerifyPro
**Multi-level KYC Verification with RAG-Supported Chatbot and KYC Sharing**

![Node.js](https://img.shields.io/badge/node-%23339933.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![LangChain](https://img.shields.io/badge/LangChain-AI-blue?style=for-the-badge)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

---

## Problem Statement
Traditional KYC processes are slow, manual, and prone to errors:
- Compliance teams spend hours manually reviewing documents and verifying customer information
- Limited ability to share verified KYC data across institutions  
- No centralized system for sanctions screening and risk assessment
- Customers face repeated verification processes across different platforms

---

## Solution
VerifyPro automates and streamlines the KYC verification process through:

**Multi-level KYC Verification**
- Automated document processing and validation
- OCR and intelligent data extraction
- Rule-based verification engine
- Risk assessment and scoring

**RAG-Supported Chatbot**
- Interactive compliance assistance
- Real-time query resolution
- Document-based question answering
- Regulatory guidance and support

**KYC Sharing**
- Secure inter-institutional data sharing
- Standardized verification records
- Reduced redundant verification processes
- Compliance with data protection regulations

---

## Architecture
```
Customer → Next.js Frontend → Express Orchestrator → Microservices
    ├── Document Service (FastAPI, OCR)
    ├── Extraction Service (LangChain, Pydantic)
    ├── Rules Engine (Express)
    ├── Screening Service (RAG + Vector DB)
    └── Report Generator
```

---

## Workflow
1. **Upload** → Customer submits PDFs, images, or links.  
2. **OCR & Extraction** → FastAPI + LangChain parse documents into JSON.  
3. **Validation** → Express rules check expiry dates, ID formats, ownership chains.  
4. **Screening** → RAG searches sanctions DB, PEP lists, adverse media.  
5. **Decision** → System generates a compliance pack for analysts.  

---

## Features
- Upload multiple KYC documents in seconds  
- AI-powered entity extraction (LangChain)  
- Sanctions & PEP search via RAG + vector DB  
- Automated decision packs (Pass/Review/Reject)  
- Web UI for customers and compliance teams  
- Fully containerized with Docker  

---

## Quick Start

```bash
# Clone repo
git clone https://github.com/your-org/verifypro.git
cd verifypro

# Start all services
docker-compose up --build

# Run frontend
cd frontend && npm run dev

# Run orchestrator
cd orchestrator && npm run dev

# Run FastAPI OCR service
cd services/ocr && uvicorn main:app --reload
```

Frontend available at: `http://localhost:3000`

---

## Before vs After

| Step              | Manual KYC | Automated KYC |
|-------------------|------------|---------------|
| Document Review   | Manual reading | OCR + LangChain |
| Verification      | Human checks | Rules Engine |
| Sanctions Search  | Google + lists | RAG + Vector DB |
| Turnaround Time   | Days | Minutes |
| Error Risk        | High | Low |
| Scalability       | Poor | Excellent |


