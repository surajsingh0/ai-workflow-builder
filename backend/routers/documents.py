from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database
from r2_client import r2_client, R2_BUCKET_NAME, R2_ACCOUNT_ID
import os
import fitz  # PyMuPDF
import uuid
import boto3

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload", response_model=schemas.Document)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. Read file content
    file_content = await file.read()
    
    # Generate unique filename to avoid collisions
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # 2. Try R2 upload, fallback to local storage
    public_url = unique_filename  # Default
    use_local = False
    
    # Check if R2 is configured
    if R2_BUCKET_NAME and r2_client:
        try:
            r2_client.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=unique_filename,
                Body=file_content,
                ContentType=file.content_type
            )
            
            public_url_base = os.getenv("R2_PUBLIC_URL_BASE")
            if public_url_base:
                public_url = f"{public_url_base}/{unique_filename}"
            print(f"Uploaded to R2: {unique_filename}")
        except Exception as e:
            print(f"R2 Upload Error (falling back to local): {e}")
            use_local = True
    else:
        print("R2 not configured, using local storage")
        use_local = True
    
    # Fallback: Save to local uploads directory
    if use_local:
        uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        local_path = os.path.join(uploads_dir, unique_filename)
        
        with open(local_path, "wb") as f:
            f.write(file_content)
        
        public_url = f"local://{unique_filename}"
        print(f"Saved locally: {local_path}")

    # 3. Extract Text (In-memory for now)
    text_content = ""
    if file.content_type == "application/pdf":
        try:
           with fitz.open(stream=file_content, filetype="pdf") as doc:
                for page in doc:
                    text_content += page.get_text()
        except Exception as e:
            print(f"Text Extraction Error: {e}")
            # Non-blocking

    # 4. Create DB Entry
    db_document = models.Document(
        filename=file.filename,
        file_path=public_url, # Store URL or Key
        content_type=file.content_type,
        file_size=len(file_content)
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    # 5. Trigger Vector Store Embedding
    # We execute this synchronously for now, but in prod this should be a background task (Celery/redis-queue)
    if text_content:
        try:
            from vector_store import add_document_to_vector_store
            add_document_to_vector_store(
                doc_id=str(db_document.id), 
                text=text_content, 
                metadata={"filename": file.filename}
            )
        except Exception as e:
            print(f"Vector Store Indexing Error: {e}")

    return db_document

@router.get("/", response_model=list[schemas.Document])
def read_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Document).offset(skip).limit(limit).all()
