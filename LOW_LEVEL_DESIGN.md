# Low Level Design (LLD)

## 1. Directory Structure

```
ai-workflow-builder/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── database.py             # SQLAlchemy engine & session
│   ├── models.py               # ORM models (Workflow, Document)
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── vector_store.py         # ChromaDB client & embedding functions
│   ├── r2_client.py            # Cloudflare R2 S3-compatible client
│   ├── routers/
│   │   ├── workflows.py        # /workflows CRUD endpoints
│   │   ├── documents.py        # /documents/upload endpoint
│   │   └── workflow_run.py     # /run_workflow execution engine
│   ├── chroma_db/              # Persistent vector store data
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── web/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx           # Workflow listing page
│   │   │   └── builder/
│   │   │       ├── WorkflowBuilder.tsx # Main canvas component
│   │   │       ├── Sidebar.tsx         # Component palette
│   │   │       └── nodes/
│   │   │           ├── index.ts        # Node type registry
│   │   │           ├── UserQueryNode.tsx
│   │   │           ├── LLMEngineNode.tsx
│   │   │           ├── KnowledgeBaseNode.tsx
│   │   │           └── OutputNode.tsx
│   │   ├── components/
│   │   │   ├── Header.tsx              # App header with save button
│   │   │   └── ChatModal.tsx           # Workflow execution chat UI
│   │   ├── config.ts                   # API endpoints configuration
│   │   └── App.tsx                     # Router setup
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── README.md
├── HIGH_LEVEL_DESIGN.md
└── LOW_LEVEL_DESIGN.md
```

## 2. Database Schema

### 2.1 Workflow Table
```sql
CREATE TABLE workflows (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    data        JSONB,        -- Stores React Flow state (nodes, edges, viewport)
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 Document Table
```sql
CREATE TABLE documents (
    id           SERIAL PRIMARY KEY,
    filename     VARCHAR(255) NOT NULL,
    file_path    VARCHAR(512),  -- R2 object key or URL
    content_type VARCHAR(100),
    file_size    INTEGER,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. API Endpoints

### 3.1 Workflows Router (`/workflows`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workflows` | List all workflows |
| GET | `/workflows/{id}` | Get single workflow |
| POST | `/workflows` | Create new workflow |
| PUT | `/workflows/{id}` | Update workflow |
| DELETE | `/workflows/{id}` | Delete workflow |

### 3.2 Documents Router (`/documents`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/upload` | Upload & process PDF |
| GET | `/documents` | List all documents |

### 3.3 Workflow Runner (`/run_workflow`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/run_workflow` | Execute workflow graph |

**Request Body:**
```json
{
    "workflow_id": "string",
    "query": "string",
    "nodes": [...],
    "edges": [...]
}
```

**Response:**
```json
{
    "response": "AI generated answer",
    "sources": ["doc1.pdf", "Web: Title"]
}
```

## 4. Core Algorithms

### 4.1 Workflow Execution (Graph Traversal)
```python
def run_workflow(nodes, edges, query):
    # 1. Find Knowledge Base nodes
    kb_nodes = [n for n in nodes if n.type == 'knowledgeBase']
    
    # 2. Find LLM Engine node (required)
    llm_node = next(n for n in nodes if n.type == 'llmEngine')
    
    # 3. Check if KB is connected to LLM
    context = ""
    for edge in edges:
        if edge.target == llm_node.id:
            source = find_node(nodes, edge.source)
            if source.type == 'knowledgeBase':
                context = query_chromadb(query)
    
    # 4. Optional: Web search
    if llm_node.data.useWebSearch:
        web_context = call_serpapi(query)
    
    # 5. Call LLM via OpenRouter
    response = openrouter_client.chat(
        model=llm_node.data.model,
        messages=[
            {"role": "system", "content": llm_node.data.prompt},
            {"role": "user", "content": f"{query}\n\nContext: {context}"}
        ]
    )
    
    return response
```

### 4.2 Document Processing Pipeline
```python
def process_document(file):
    # 1. Upload raw file to R2
    r2_key = upload_to_r2(file)
    
    # 2. Extract text with PyMuPDF
    text = extract_text_from_pdf(file.content)
    
    # 3. Chunk text (1000 chars per chunk)
    chunks = chunk_text(text, size=1000)
    
    # 4. Generate embeddings & store in ChromaDB
    for i, chunk in enumerate(chunks):
        chromadb.add(
            id=f"{doc_id}_{i}",
            document=chunk,
            metadata={"filename": file.name}
        )
    
    # 5. Save metadata to Postgres
    save_document_metadata(filename, r2_key, size)
```

## 5. Frontend Component Hierarchy

```
App
├── Dashboard
│   └── WorkflowCard (mapped)
│
└── WorkflowBuilder (ReactFlowProvider)
    ├── Header
    │   └── Save Button
    ├── Sidebar
    │   └── Draggable Node Items
    ├── ReactFlow Canvas
    │   ├── UserQueryNode
    │   ├── KnowledgeBaseNode (with file upload)
    │   ├── LLMEngineNode (with model/API config)
    │   └── OutputNode
    ├── WorkflowControls (zoom/pan)
    └── ChatModal
        └── Message List + Input
```

## 6. State Management

| State | Location | Purpose |
|-------|----------|---------|
| `nodes` | WorkflowBuilder (useNodesState) | Node positions & data |
| `edges` | WorkflowBuilder (useEdgesState) | Connections between nodes |
| `showChat` | WorkflowBuilder (useState) | Chat modal visibility |
| `messages` | ChatModal (useState) | Chat history |
| `isThinking` | ChatModal (useState) | Loading state |

## 7. Validation Rules

| Rule | Check |
|------|-------|
| Empty Workflow | `nodes.length === 0` |
| Missing LLM | No node with `type === 'llmEngine'` |
| Unconnected LLM | LLM node has no incoming edges |

## 8. Security Considerations

- API keys stored in `.env`, never committed
- CORS restricted to frontend origin
- File uploads validated by content type
- No SQL injection (ORM parameterized queries)
