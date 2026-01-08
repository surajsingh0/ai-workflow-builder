# High Level Design (HLD)

## 1. System Overview

The **AI Workflow Builder** is a No-Code/Low-Code platform that enables users to visually design and execute AI-powered workflows. Users connect modular components (Input, Knowledge Base, LLM, Output) to create custom AI pipelines.

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        React.js Frontend (Vite)                        │  │
│  │  ┌─────────────┐  ┌─────────────────────┐  ┌───────────────────────┐  │  │
│  │  │  Dashboard  │  │  Workflow Builder   │  │     Chat Modal        │  │  │
│  │  │   (CRUD)    │  │   (React Flow)      │  │   (Query Interface)   │  │  │
│  │  └─────────────┘  └─────────────────────┘  └───────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ REST API (HTTP)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   SERVER                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        FastAPI Backend (Python)                        │  │
│  │  ┌─────────────┐  ┌─────────────────────┐  ┌───────────────────────┐  │  │
│  │  │  Workflows  │  │    Documents        │  │   Workflow Runner     │  │  │
│  │  │   Router    │  │     Router          │  │      Router           │  │  │
│  │  └──────┬──────┘  └──────────┬──────────┘  └───────────┬───────────┘  │  │
│  │         │                    │                         │               │  │
│  │         ▼                    ▼                         ▼               │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                       Core Services                              │  │  │
│  │  │   • Vector Store (ChromaDB)    • LLM Client (OpenRouter)        │  │  │
│  │  │   • Text Extraction (PyMuPDF)  • Web Search (SerpAPI)           │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                               │
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────────┐
        │    PostgreSQL     │           │   External APIs       │
        │    (Metadata)     │           │  • OpenRouter (LLMs)  │
        └───────────────────┘           │  • OpenAI (Embeddings)│
                                        │  • SerpAPI (Search)   │
                                        │  • Cloudflare R2      │
                                        └───────────────────────┘
```

## 3. Component Breakdown

### 3.1 Frontend Layer
| Component | Technology | Responsibility |
|-----------|------------|----------------|
| Dashboard | React + TypeScript | List/Create/Delete workflows |
| Workflow Builder | React Flow | Visual node-based workflow design |
| Chat Modal | React | Execute workflow and display results |
| Node Components | Custom React | User Query, KB, LLM, Output |

### 3.2 Backend Layer
| Component | Technology | Responsibility |
|-----------|------------|----------------|
| Workflows API | FastAPI | CRUD operations for workflow definitions |
| Documents API | FastAPI | File upload, text extraction, embedding |
| Workflow Runner | FastAPI | Graph traversal and execution engine |
| Vector Store | ChromaDB | Store and query document embeddings |

### 3.3 Data Layer
| Store | Purpose |
|-------|---------|
| PostgreSQL | Workflow metadata, document metadata |
| ChromaDB | Vector embeddings for semantic search |
| Cloudflare R2 | Raw file storage (PDFs) |

## 4. Data Flow

### Workflow Execution Flow
```
User Query → Frontend Chat → POST /run_workflow
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Load Workflow Graph │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
           ┌───────────────┐               ┌───────────────┐
           │ Knowledge Base│               │   Web Search  │
           │   (Optional)  │               │   (Optional)  │
           └───────┬───────┘               └───────┬───────┘
                   │ Context                       │ Context
                   └───────────────┬───────────────┘
                                   ▼
                         ┌──────────────────────┐
                         │     LLM Engine       │
                         │ (OpenRouter API)     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                              AI Response
```

## 5. Key Design Decisions

1. **OpenRouter over Direct LLM APIs** - Single API for multiple models (GPT-5.2, Gemini 3, Claude 4.5, etc.)
2. **In-Node Configuration** - Settings embedded in node cards rather than separate config panel
3. **ChromaDB for Vector Store** - Local-first, no external dependency for embeddings
4. **React Flow** - Production-ready drag-and-drop with built-in edge routing
