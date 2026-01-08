import chromadb
from chromadb.utils import embedding_functions
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize ChromaDB
# Using a local persistent directory for now. In production this might be a server.
CHROMA_DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
client = chromadb.PersistentClient(path=CHROMA_DB_DIR)

# Setup OpenAI Embedding Function
openai_api_key = os.getenv("OPENAI_API_KEY")
embedding_fn = None

if openai_api_key:
    try:
        embedding_fn = embedding_functions.OpenAIEmbeddingFunction(
            api_key=openai_api_key,
            model_name="text-embedding-3-small"
        )
    except Exception as e:
        print(f"WARNING: Failed to initialize OpenAI embeddings: {e}")
else:
    print("WARNING: OPENAI_API_KEY not found. Vector store will not work correctly.")

# collection = client.get_or_create_collection(name="documents", embedding_function=embedding_fn)

def get_collection():
    return client.get_or_create_collection(
        name="documents", 
        embedding_function=embedding_fn
    )

def add_document_to_vector_store(doc_id: str, text: str, metadata: dict = None):
    collection = get_collection()
    
    # Simple chunking (can be improved)
    chunk_size = 1000
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    
    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    metadatas = [metadata or {} for _ in range(len(chunks))]
    for m in metadatas:
        m["doc_id"] = str(doc_id)
        
    collection.add(
        documents=chunks,
        ids=ids,
        metadatas=metadatas
    )
    print(f"Added {len(chunks)} chunks to vector store for doc {doc_id}")

def query_vector_store(query_text: str, n_results: int = 5, doc_id: str = None):
    collection = get_collection()
    
    # Build query parameters
    query_params = {
        "query_texts": [query_text],
        "n_results": n_results
    }
    
    # Add filter by doc_id if provided
    if doc_id:
        query_params["where"] = {"doc_id": str(doc_id)}
    
    results = collection.query(**query_params)
    return results
