from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import workflows, documents, workflow_run

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Workflow Builder API",
    description="Backend for the AI Workflow Builder application",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflows.router)
app.include_router(documents.router)
app.include_router(workflow_run.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the AI Workflow Builder API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
