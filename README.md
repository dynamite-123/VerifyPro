# 🔐 SentinelKYC  
**Automated KYC Verification using LangChain, RAG, Express.js, FastAPI, and Next.js**

![Node.js](https://img.shields.io/badge/node-%23339933.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![LangChain](https://img.shields.io/badge/LangChain-AI-blue?style=for-the-badge)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

---

## 📌 Problem
KYC (Know Your Customer) onboarding is slow and manual:
- Teams spend hours reviewing PDFs, IDs, financials.  
- Analysts must cross-check sanctions and PEP lists.  
- Errors lead to compliance risk and customer drop-offs.  

---

## 💡 Solution
**SentinelKYC** automates the **end-to-end KYC process**:
- Upload documents & links via a clean **Next.js portal**.  
- **OCR + LangChain** extract structured data from unstructured sources.  
- **Express.js Rules Engine** validates documents, expiry dates, and IDs.  
- **RAG-powered Sanctions & Media Screening** finds risks with explainable evidence.  
- Final output: **PASS / REVIEW / REJECT** with a decision report.  

---

## 🏗️ Architecture
```
Customer → Next.js Frontend → Express Orchestrator → Microservices
    ├── Document Service (FastAPI, OCR)
    ├── Extraction Service (LangChain, Pydantic)
    ├── Rules Engine (Express)
    ├── Screening Service (RAG + Vector DB)
    └── Report Generator
```

---

## 🔄 Workflow
1. **Upload** → Customer submits PDFs, images, or links.  
2. **OCR & Extraction** → FastAPI + LangChain parse documents into JSON.  
3. **Validation** → Express rules check expiry dates, ID formats, ownership chains.  
4. **Screening** → RAG searches sanctions DB, PEP lists, adverse media.  
5. **Decision** → System generates a compliance pack for analysts.  

---

## ✨ Features
- 📂 Upload multiple KYC documents in seconds  
- 🧠 AI-powered entity extraction (LangChain)  
- 🔎 Sanctions & PEP search via RAG + vector DB  
- 📊 Automated decision packs (Pass/Review/Reject)  
- 🖥️ Web UI for customers and compliance teams  
- 🐳 Fully containerized with Docker  

---

## ⚡ Quick Start

```bash
# Clone repo
git clone https://github.com/your-org/sentinel-kyc.git
cd sentinel-kyc

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

## 📊 Before vs After

| Step              | Manual KYC | Automated KYC |
|-------------------|------------|---------------|
| Document Review   | Manual reading | OCR + LangChain |
| Verification      | Human checks | Rules Engine |
| Sanctions Search  | Google + lists | RAG + Vector DB |
| Turnaround Time   | Days | Minutes |
| Error Risk        | High | Low |
| Scalability       | Poor | Excellent |


