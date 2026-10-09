# MedAI — AI-Assisted Healthcare & Wellness Platform 🩺

MedAI is a full-stack healthcare and wellness project exploring AI-assisted workflows, health information management, medical document analysis, and intelligent health tools.

> **Responsible use:** MedAI is a software project and is not a substitute for professional medical diagnosis or treatment. AI-generated health information must be reviewed by qualified professionals.

## ✨ Project Areas

- Patient, doctor, and admin workflows
- AI chatbot and health-document analysis
- Retrieval-Augmented Generation (RAG)
- Digital prescriptions and medicine reminders
- Health tracking and analytics
- Medical-image ML experiments
- Backend APIs and data services

## 🛠️ Tech Stack

**Frontend:** React, Vite, Tailwind CSS  
**Backend:** Python, FastAPI, Uvicorn, Redis  
**Database:** MongoDB  
**AI/LLM:** Gemini, OpenAI, Hugging Face, Ollama  
**RAG:** LangChain, FAISS, ChromaDB, sentence-transformers  
**ML:** PyTorch, torchvision, timm, MedMNIST, scikit-learn

## 📁 Structure

```text
MedAi/
├── backend/       # FastAPI services
├── frontend/      # Web application
├── *.ipynb        # ML experiments
├── setup_models.sh
└── setup_models.bat
```

## 🚀 Getting Started

### Backend

```bash
python -m venv .venv
```

Activate the environment and install dependencies:

```bash
pip install -r backend/requirements.txt
```

Configure the environment variables required by the backend, then start the FastAPI application using its configured entrypoint.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Never commit API keys, database credentials, authentication secrets, or other sensitive configuration.

## 🎯 Goal

Combine full-stack engineering with responsible AI and RAG techniques to build practical healthcare and wellness software.

## 👨‍💻 Author

[Varshith Gorrepati](https://github.com/VARSHITHGORREPATI)
