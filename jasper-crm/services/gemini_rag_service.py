"""
Gemini RAG Service for JASPER CRM
Uses Gemini 3.0 Flash for all RAG operations
"""

import os
import logging
from typing import Optional, List, Dict, Any
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# IMPORTANT: Use Gemini 3.0 Flash consistently
GEMINI_MODEL = "gemini-2.5-flash-lite"


class GeminiRAGService:
    """
    Managed RAG using Gemini API File Search Tool.
    Complements ALEPH for client documents and real-time research.
    """
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        
        self.client = genai.Client(api_key=api_key)
        self.model = GEMINI_MODEL
        self._stores: Dict[str, str] = {}  # name -> store_id mapping
        logger.info(f"GeminiRAGService initialized with model: {self.model}")
    
    # =========================================================================
    # FILE SEARCH (Managed RAG)
    # =========================================================================
    
    def create_file_search_store(self, name: str) -> str:
        """
        Create a File Search store for document indexing.
        
        Args:
            name: Display name for the store (e.g., "jasper-client-docs")
        
        Returns:
            Store resource name
        """
        try:
            store = self.client.file_search_stores.create(display_name=name)
            self._stores[name] = store.name
            logger.info(f"Created File Search store: {name} -> {store.name}")
            return store.name
        except Exception as e:
            logger.error(f"Failed to create store {name}: {e}")
            raise
    
    def get_or_create_store(self, name: str) -> str:
        """Get existing store or create new one."""
        if name in self._stores:
            return self._stores[name]
        
        # Check if store exists
        try:
            stores = list(self.client.file_search_stores.list())
            for store in stores:
                if store.display_name == name:
                    self._stores[name] = store.name
                    return store.name
        except Exception:
            pass
        
        # Create new store
        return self.create_file_search_store(name)
    
    def upload_document(
        self,
        store_name: str,
        file_path: str,
        display_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upload and index a document to File Search store.
        
        Supported formats: PDF, DOCX, TXT, JSON, MD, HTML, code files
        Max size: 100 MB per file
        
        Args:
            store_name: Name of the File Search store
            file_path: Path to the file to upload
            display_name: Optional display name for the file
        
        Returns:
            Upload result with file metadata
        """
        store_id = self.get_or_create_store(store_name)
        
        try:
            with open(file_path, "rb") as f:
                result = self.client.file_search_stores.upload_to_file_search_store(
                    file_search_store=store_id,
                    file=f,
                    display_name=display_name or os.path.basename(file_path)
                )
            
            logger.info(f"Uploaded {file_path} to store {store_name}")
            return {
                "success": True,
                "file_name": display_name or os.path.basename(file_path),
                "store": store_name
            }
        except Exception as e:
            logger.error(f"Failed to upload {file_path}: {e}")
            return {"success": False, "error": str(e)}
    
    def search_documents(
        self,
        store_name: str,
        query: str,
        include_citations: bool = True
    ) -> Dict[str, Any]:
        """
        Search documents using semantic search with Gemini 3.0 Flash.
        
        Args:
            store_name: Name of the File Search store
            query: Natural language query
            include_citations: Whether to include source citations
        
        Returns:
            Answer with optional citations
        """
        store_id = self.get_or_create_store(store_name)
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=query,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(
                        file_search=types.FileSearchTool(
                            file_search_store=store_id
                        )
                    )]
                )
            )
            
            result = {
                "success": True,
                "answer": response.text,
                "model": self.model
            }
            
            if include_citations:
                try:
                    grounding = response.candidates[0].grounding_metadata
                    if grounding:
                        result["citations"] = grounding
                except (AttributeError, IndexError):
                    result["citations"] = None
            
            return result
            
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return {"success": False, "error": str(e)}
    
    def delete_store(self, name: str) -> bool:
        """Delete a File Search store."""
        if name not in self._stores:
            return False
        
        try:
            self.client.file_search_stores.delete(name=self._stores[name])
            del self._stores[name]
            logger.info(f"Deleted store: {name}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete store {name}: {e}")
            return False
    
    # =========================================================================
    # URL CONTEXT (Real-time Web Research)
    # =========================================================================
    
    def research_url(
        self,
        url: str,
        question: str,
        additional_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Query a URL directly using Gemini 3.0 Flash URL Context.
        
        Great for:
        - DFI websites (UKIB, BII, FMO, etc.)
        - SEC filings and regulatory documents
        - Company websites and press releases
        - PDF documents hosted online
        
        Args:
            url: URL to analyze
            question: Question about the URL content
            additional_context: Optional context to include
        
        Returns:
            Answer grounded in URL content
        """
        prompt = question
        if additional_context:
            prompt = f"{additional_context}\n\nQuestion: {question}"
        
        try:
            # Include URL in the prompt with url_context tool
            full_prompt = f"Based on the content at {url}, please answer: {prompt}"
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    tools=[{"url_context": {}}]
                )
            )
            
            return {
                "success": True,
                "answer": response.text,
                "url": url,
                "model": self.model
            }
            
        except Exception as e:
            logger.error(f"URL research failed for {url}: {e}")
            return {"success": False, "error": str(e), "url": url}
    
    def research_multiple_urls(
        self,
        urls: List[str],
        question: str
    ) -> Dict[str, Any]:
        """
        Query multiple URLs and synthesize answer.
        
        Args:
            urls: List of URLs to analyze (max 5 recommended)
            question: Question spanning all URLs
        
        Returns:
            Synthesized answer from all sources
        """
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=question,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(
                        url_context=types.UrlContextTool(urls=urls)
                    )]
                )
            )
            
            return {
                "success": True,
                "answer": response.text,
                "urls": urls,
                "model": self.model
            }
            
        except Exception as e:
            logger.error(f"Multi-URL research failed: {e}")
            return {"success": False, "error": str(e)}
    
    # =========================================================================
    # GOOGLE SEARCH GROUNDING (Current News/Events)
    # =========================================================================
    
    def search_web(
        self,
        query: str,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search the web using Google Search grounding.
        
        Great for:
        - Current DFI news and announcements
        - Market updates
        - Recent funding rounds
        - Policy changes
        
        Args:
            query: Search query
            context: Optional context to guide the search
        
        Returns:
            Answer grounded in current web results
        """
        prompt = query
        if context:
            prompt = f"Context: {context}\n\nQuery: {query}"
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[{"google_search": {}}]
                )
            )
            
            return {
                "success": True,
                "answer": response.text,
                "query": query,
                "model": self.model,
                "grounded": True
            }
            
        except Exception as e:
            logger.error(f"Web search failed: {e}")
            return {"success": False, "error": str(e)}
    
    # =========================================================================
    # JASPER-SPECIFIC METHODS
    # =========================================================================
    
    def research_dfi(
        self,
        dfi_name: str,
        question: str
    ) -> Dict[str, Any]:
        """
        Research a specific DFI using web search grounding.
        
        Args:
            dfi_name: Name of DFI (e.g., "UKIB", "BII", "FMO")
            question: Specific question about the DFI
        
        Returns:
            Current information about the DFI
        """
        context = f"""
        You are researching {dfi_name} (Development Finance Institution).
        Focus on:
        - Investment criteria and sectors
        - Recent funding announcements
        - Application requirements
        - Geographic focus
        Provide accurate, current information.
        """
        
        return self.search_web(
            query=f"{dfi_name} {question}",
            context=context
        )
    
    def analyze_client_document(
        self,
        store_name: str,
        document_type: str,
        questions: List[str]
    ) -> Dict[str, Any]:
        """
        Analyze a client document with multiple questions.
        
        Args:
            store_name: File Search store containing the document
            document_type: Type of document (e.g., "business plan", "financial model")
            questions: List of questions to answer
        
        Returns:
            Structured analysis with answers to each question
        """
        context = f"Analyzing a {document_type}. Answer each question based on the document content."
        
        results = []
        for q in questions:
            result = self.search_documents(
                store_name=store_name,
                query=f"{context}\n\nQuestion: {q}"
            )
            results.append({
                "question": q,
                "answer": result.get("answer", "Unable to answer"),
                "success": result.get("success", False)
            })
        
        return {
            "success": True,
            "document_type": document_type,
            "analysis": results
        }


# Singleton instance
_gemini_rag_service: Optional[GeminiRAGService] = None


def get_gemini_rag_service() -> GeminiRAGService:
    """Get singleton GeminiRAGService instance."""
    global _gemini_rag_service
    if _gemini_rag_service is None:
        _gemini_rag_service = GeminiRAGService()
    return _gemini_rag_service
