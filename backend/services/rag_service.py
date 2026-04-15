import warnings
import logging
import io
import contextlib
import os

# Suppress noisy HuggingFace startup warnings
warnings.filterwarnings("ignore")
os.environ.setdefault("HF_HUB_DISABLE_IMPLICIT_TOKEN", "1")
os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)

from langchain_community.vectorstores import Chroma, FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from typing import List
import asyncio

from config.settings import settings

class RAGService:
    def __init__(self):
        """Initialize RAG service with FREE local embeddings (sentence-transformers)"""
        try:
            # Use local sentence-transformers model (FREE, no API needed!)
            # Silence the BertModel LOAD REPORT printed to stdout
            with contextlib.redirect_stdout(io.StringIO()):
                self.embeddings = HuggingFaceEmbeddings(
                    model_name="all-MiniLM-L6-v2",  # Small, fast, accurate
                    model_kwargs={'device': 'cpu'},
                    encode_kwargs={'normalize_embeddings': True}
                )
            self.embeddings_available = True
            print("✅ Using local embeddings (sentence-transformers) - FREE & UNLIMITED!")
        except Exception as e:
            self.embeddings = None
            self.embeddings_available = False
            print(f"⚠️ Warning: Could not load embeddings: {e}")
        
        self.chroma_db = None
        self.faiss_db = None
        self.initialized = False
    
    async def initialize(self):
        """Initialize vector databases"""
        if self.initialized:
            return
        
        if not self.embeddings_available:
            print("❌ Cannot initialize RAG: embeddings not available")
            return
        
        try:
            # Try to load existing Chroma database
            if os.path.exists(settings.CHROMA_PERSIST_DIR):
                self.chroma_db = Chroma(
                    persist_directory=settings.CHROMA_PERSIST_DIR,
                    embedding_function=self.embeddings
                )
                print("✅ Loaded existing Chroma database")
            
            # Try to load existing FAISS database
            if os.path.exists(f"{settings.FAISS_INDEX_PATH}/index.faiss"):
                self.faiss_db = FAISS.load_local(
                    settings.FAISS_INDEX_PATH,
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                print("✅ Loaded existing FAISS database")
            
            self.initialized = True
            
        except Exception as e:
            print(f"⚠️ Warning: Could not load vector databases: {str(e)}")
            print("You can create them using the ingest_medical_documents method")
    
    async def ingest_medical_documents(self, documents_path: str):
        """Ingest medical documents into vector databases"""
        if not self.embeddings_available:
            raise ValueError("GEMINI_API_KEY not configured. Cannot create embeddings.")
        
        # Load documents
        loader = DirectoryLoader(
            documents_path,
            glob="**/*.txt",
            loader_cls=TextLoader
        )
        documents = loader.load()
        
        # Split documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        splits = text_splitter.split_documents(documents)
        
        # Create Chroma database
        self.chroma_db = Chroma.from_documents(
            documents=splits,
            embedding=self.embeddings,
            persist_directory=settings.CHROMA_PERSIST_DIR
        )
        self.chroma_db.persist()
        
        # Create FAISS database
        self.faiss_db = FAISS.from_documents(
            documents=splits,
            embedding=self.embeddings
        )
        self.faiss_db.save_local(settings.FAISS_INDEX_PATH)
        
        print(f"✅ Ingested {len(splits)} document chunks into vector databases")
        self.initialized = True
    
    async def search_medical_knowledge(self, query: str, k: int = 3) -> List[dict]:
        """Search medical knowledge base using RAG"""
        if not self.initialized:
            await self.initialize()
        
        results = []
        
        try:
            # Search Chroma database if available
            if self.chroma_db:
                chroma_results = self.chroma_db.similarity_search_with_score(query, k=k)
                for doc, score in chroma_results:
                    results.append({
                        "content": doc.page_content,
                        "metadata": doc.metadata,
                        "score": float(score),
                        "source": "chroma"
                    })
            
            # Search FAISS database if available and no Chroma results
            elif self.faiss_db:
                faiss_results = self.faiss_db.similarity_search_with_score(query, k=k)
                for doc, score in faiss_results:
                    results.append({
                        "content": doc.page_content,
                        "metadata": doc.metadata,
                        "score": float(score),
                        "source": "faiss"
                    })
        
        except Exception as e:
            print(f"⚠️ Warning: Vector search failed: {str(e)}")
            print("Returning default medical knowledge")
            # Return some default medical knowledge if databases aren't available
            results = [
                {
                    "content": "General medical advice: Always consult with healthcare professionals for personalized medical advice.",
                    "metadata": {"title": "General Medical Guidance"},
                    "score": 0.5,
                    "source": "default"
                }
            ]
        
        return results
    
    async def add_document(self, text: str, metadata: dict):
        """Add a single document to the vector databases"""
        if not self.initialized:
            await self.initialize()
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = text_splitter.split_text(text)
        
        # Add to Chroma
        if self.chroma_db:
            self.chroma_db.add_texts(chunks, metadatas=[metadata] * len(chunks))
            self.chroma_db.persist()
        
        # Add to FAISS
        if self.faiss_db:
            self.faiss_db.add_texts(chunks, metadatas=[metadata] * len(chunks))
            self.faiss_db.save_local(settings.FAISS_INDEX_PATH)
