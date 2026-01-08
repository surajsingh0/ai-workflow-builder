from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional, AsyncGenerator
import os
from sqlalchemy.orm import Session
from database import get_db
import traceback
from vector_store import query_vector_store
from openai import OpenAI
import json
import asyncio

router = APIRouter()

# Initialize Clients
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")

# OpenRouter client using OpenAI SDK
client = None
if OPENROUTER_API_KEY:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )

class WorkflowRunRequest(BaseModel):
    workflow_id: str
    query: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class WorkflowRunResponse(BaseModel):
    response: str
    sources: List[str] = []

def find_node_by_id(nodes: List[Dict], node_id: str):
    for node in nodes:
        if node["id"] == node_id:
            return node
    return None

def get_next_nodes(edges: List[Dict], current_node_id: str):
    next_node_ids = []
    for edge in edges:
        if edge["source"] == current_node_id:
            next_node_ids.append(edge["target"])
    return next_node_ids

@router.post("/run_workflow", response_model=WorkflowRunResponse)
async def run_workflow(request: WorkflowRunRequest, db: Session = Depends(get_db)):
    try:
        nodes = request.nodes
        edges = request.edges
        user_query = request.query
        
        context = ""
        sources = []
        
        # Find Knowledge Base Nodes
        kb_nodes = [n for n in nodes if n["type"] == "knowledgeBase"]
        llm_nodes = [n for n in nodes if n["type"] == "llmEngine"]
        
        if not llm_nodes:
            return WorkflowRunResponse(response="Error: No LLM Engine node found in workflow.", sources=[])
        
        target_llm_node = llm_nodes[0] # Assuming single LLM for now
        
        # Check if any KB node is connected to this LLM node
        connected_kb_node = None
        for edge in edges:
            if edge["target"] == target_llm_node["id"]:
                source_node = find_node_by_id(nodes, edge["source"])
                if source_node and source_node["type"] == "knowledgeBase":
                    connected_kb_node = source_node
                    break
        
        # Execute Knowledge Base Retrieval
        if connected_kb_node:
            print(f"Executing KB Node: {connected_kb_node['id']}")
            kb_data = connected_kb_node.get("data", {})
            file_info = kb_data.get("file")
            
            if file_info:
                doc_id = file_info.get('id')
                results = query_vector_store(user_query, n_results=3, doc_id=doc_id)
                if results and "documents" in results:
                     # Flatten results
                    docs = results["documents"][0] # Chroma returns list of lists
                    metadatas = results["metadatas"][0]
                    
                    context_parts = []
                    seen_sources = set()
                    for i, doc in enumerate(docs):
                        context_parts.append(doc)
                        filename = metadatas[i].get("filename", "Unknown File")
                        if filename not in seen_sources:
                            sources.append(filename)
                            seen_sources.add(filename)
                    
                    context = "\n\n".join(context_parts)
                    print(f"Retrieved Context: {len(context)} chars")

        # Execute LLM Node
        print(f"Executing LLM Node: {target_llm_node['id']}")
        llm_data = target_llm_node.get("data", {})
        
        model = llm_data.get("model", "google/gemini-2.0-flash-exp:free") # Default to free one
        api_key = llm_data.get("apiKey") or OPENROUTER_API_KEY
        system_prompt = llm_data.get("prompt", "You are a helpful AI assistant.")
        temperature = float(llm_data.get("temperature", 0.7))
        use_web_search = llm_data.get("useWebSearch", False)
        serp_api_key = llm_data.get("serpApiKey") or SERPAPI_API_KEY
        
        # Web Search Integration
        web_context = ""
        if use_web_search:
            if not serp_api_key:
                web_context = "[Web Search Failed: No SERP API Key provided]"
            else:
                try:
                    from serpapi import GoogleSearch
                    print("Executing Web Search...")
                    search = GoogleSearch({
                        "q": user_query,
                        "api_key": serp_api_key
                    })
                    search_results = search.get_dict()
                    organic_results = search_results.get("organic_results", [])
                    
                    web_snippets = []
                    for res in organic_results[:3]:
                        title = res.get("title", "")
                        snippet = res.get("snippet", "")
                        link = res.get("link", "")
                        web_snippets.append(f"Title: {title}\nSnippet: {snippet}\nLink: {link}")
                        sources.append(f"Web: {title}")
                    
                    web_context = "\n\nWeb Search Results:\n" + "\n---\n".join(web_snippets)
                except Exception as e:
                    print(f"SerpAPI Error: {e}")
                    web_context = f"\n[Web Search Error: {str(e)}]"

        # Construct Final Prompt
        final_system_message = system_prompt
        final_user_message = f"User Query: {user_query}"
        
        if context:
            final_user_message += f"\n\nContext from Knowledge Base:\n{context}"
            
        if web_context:
            final_user_message += f"\n\n{web_context}"

        # Call OpenRouter
        # We need to make sure we use the right client if the user provided a custom key
        runtime_client = client
        if api_key and api_key != OPENROUTER_API_KEY:
            runtime_client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key,
            )
            
        if not runtime_client:
             return WorkflowRunResponse(response="Error: OpenRouter API Key is missing. Please configure it in the node or .env.", sources=[])

        print(f"Calling OpenRouter with model: {model}")
        try:
            completion = runtime_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": final_system_message},
                    {"role": "user", "content": final_user_message}
                ],
                temperature=temperature,
            )
            
            ai_response = completion.choices[0].message.content
            return WorkflowRunResponse(response=ai_response, sources=sources)
            
        except Exception as e:
            print(f"OpenRouter Error: {e}")
            return WorkflowRunResponse(response=f"Error calling AI Provider: {str(e)}", sources=sources)

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


async def generate_stream(request: WorkflowRunRequest) -> AsyncGenerator[str, None]:
    """Generator function that yields SSE formatted chunks"""
    try:
        nodes = request.nodes
        edges = request.edges
        user_query = request.query
        
        context = ""
        sources = []
        
        # Find Knowledge Base Nodes
        kb_nodes = [n for n in nodes if n["type"] == "knowledgeBase"]
        llm_nodes = [n for n in nodes if n["type"] == "llmEngine"]
        
        if not llm_nodes:
            yield f"data: {json.dumps({'type': 'error', 'content': 'No LLM Engine node found in workflow.'})}\n\n"
            return
        
        target_llm_node = llm_nodes[0]
        
        # Check if any KB node is connected to this LLM node
        connected_kb_node = None
        for edge in edges:
            if edge["target"] == target_llm_node["id"]:
                source_node = find_node_by_id(nodes, edge["source"])
                if source_node and source_node["type"] == "knowledgeBase":
                    connected_kb_node = source_node
                    break
        
        # Execute Knowledge Base Retrieval
        if connected_kb_node:
            kb_data = connected_kb_node.get("data", {})
            file_info = kb_data.get("file")
            
            if file_info:
                # Pass doc_id to filter results to only this file
                doc_id = file_info.get('id')
                results = query_vector_store(user_query, n_results=3, doc_id=doc_id)
                if results and "documents" in results:
                    docs = results["documents"][0]
                    metadatas = results["metadatas"][0]
                    
                    context_parts = []
                    seen_sources = set()
                    for i, doc in enumerate(docs):
                        context_parts.append(doc)
                        filename = metadatas[i].get("filename", "Unknown File")
                        if filename not in seen_sources:
                            sources.append(filename)
                            seen_sources.add(filename)
                    
                    context = "\n\n".join(context_parts)

        # Execute LLM Node
        llm_data = target_llm_node.get("data", {})
        
        model = llm_data.get("model", "google/gemini-2.0-flash-exp:free")
        api_key = llm_data.get("apiKey") or OPENROUTER_API_KEY
        system_prompt = llm_data.get("prompt", "You are a helpful AI assistant.")
        temperature = float(llm_data.get("temperature", 0.7))
        use_web_search = llm_data.get("useWebSearch", False)
        serp_api_key = llm_data.get("serpApiKey") or SERPAPI_API_KEY
        
        # Web Search Integration
        web_context = ""
        if use_web_search:
            if not serp_api_key:
                web_context = "[Web Search Failed: No SERP API Key provided]"
            else:
                try:
                    from serpapi import GoogleSearch
                    search = GoogleSearch({
                        "q": user_query,
                        "api_key": serp_api_key
                    })
                    search_results = search.get_dict()
                    organic_results = search_results.get("organic_results", [])
                    
                    web_snippets = []
                    for res in organic_results[:3]:
                        title = res.get("title", "")
                        snippet = res.get("snippet", "")
                        link = res.get("link", "")
                        web_snippets.append(f"Title: {title}\nSnippet: {snippet}\nLink: {link}")
                        sources.append(f"Web: {title}")
                    
                    web_context = "\n\nWeb Search Results:\n" + "\n---\n".join(web_snippets)
                except Exception as e:
                    web_context = f"\n[Web Search Error: {str(e)}]"

        # Construct Final Prompt
        final_system_message = system_prompt
        final_user_message = f"User Query: {user_query}"
        
        if context:
            final_user_message += f"\n\nContext from Knowledge Base:\n{context}"
            
        if web_context:
            final_user_message += f"\n\n{web_context}"

        # Send sources first
        if sources:
            yield f"data: {json.dumps({'type': 'sources', 'content': sources})}\n\n"

        # Set up runtime client
        runtime_client = client
        if api_key and api_key != OPENROUTER_API_KEY:
            runtime_client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key,
            )
            
        if not runtime_client:
            yield f"data: {json.dumps({'type': 'error', 'content': 'OpenRouter API Key is missing.'})}\n\n"
            return

        # Stream the response
        try:
            stream = runtime_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": final_system_message},
                    {"role": "user", "content": final_user_message}
                ],
                temperature=temperature,
                stream=True,
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    yield f"data: {json.dumps({'type': 'content', 'content': content})}\n\n"
                    await asyncio.sleep(0)  # Yield control to event loop
            
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
                
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    except Exception as e:
        traceback.print_exc()
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"


@router.post("/run_workflow_stream")
async def run_workflow_stream(request: WorkflowRunRequest):
    """Streaming endpoint that returns Server-Sent Events"""
    return StreamingResponse(
        generate_stream(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
