from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime

# Workflow Schemas
class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    data: Dict[str, Any]  # React Flow JSON data

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowUpdate(WorkflowBase):
    pass

class Workflow(WorkflowBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Document Schemas
class DocumentBase(BaseModel):
    filename: str
    content_type: str
    file_size: int

class DocumentCreate(DocumentBase):
    file_path: str

class Document(DocumentBase):
    id: int
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True

# Chat Schemas
class ChatRequest(BaseModel):
    query: str
    workflow_id: int

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None
    
class ChatHistoryBase(BaseModel):
    user_query: str
    ai_response: str
    workflow_id: int

class ChatHistory(ChatHistoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
