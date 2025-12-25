# ============================================================================
# IMPORTS
# ============================================================================

import boto3                                    # AWS SDK for Python - to access S3
import pandas as pd                             # Data manipulation library for CSV processing
from io import StringIO                         # Handle CSV data as string buffer
from sentence_transformers import SentenceTransformer  # For generating embeddings
import faiss                                    # Facebook's library for similarity search
import numpy as np                              # Numerical operations
from typing import List, Dict, Tuple           # Type hints for better code documentation

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# ============================================================================
# CONFIGURATION
# ============================================================================

# AWS S3 Configuration
S3_BUCKET_NAME = "rag-bucket-llm"            # Name of your S3 bucket
S3_CSV_FILE_KEY = "medicaments_maroc.csv"    # Path to CSV file in S3 bucket
AWS_REGION = "eu-west-3"                       # AWS region where bucket is located

# Embedding Model Configuration
# This model converts text into numerical vectors (embeddings) for similarity search
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"  # Lightweight, fast model

# RAG Configuration
TOP_K_RESULTS = 3                              # Number of most relevant chunks to retrieve
CHUNK_SIZE = 500                               # Maximum characters per text chunk

# LLaMA Model Configuration (from your original code)
MODEL_NAME = "meta-llama/Llama-3.2-3B-Instruct"
TOKEN = "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"

# ============================================================================
# INITIALIZE MODELS AND SERVICES
# ============================================================================

print("Initializing services...")

# Initialize S3 client to interact with AWS S3
# boto3 handles authentication via AWS credentials (IAM role, config file, or env vars)
s3_client = boto3.client('s3', region_name=AWS_REGION)

# Initialize embedding model for converting text to vector representations
# This model is much smaller than LLaMA and specializes in semantic similarity
print(f"Loading embedding model {EMBEDDING_MODEL_NAME}...")
embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)

# Initialize LLaMA tokenizer and model (from your original code)
print(f"Loading {MODEL_NAME} with 4-bit quantization...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, token=TOKEN)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    use_auth_token=TOKEN,
    device_map="auto",
#    load_in_4bit=True,
    torch_dtype=torch.bfloat16,
)

# Initialize FastAPI application
app = FastAPI(title="LLaMA RAG Chat API with S3 Integration")

# ============================================================================
# GLOBAL VARIABLES FOR RAG SYSTEM
# ============================================================================

# These will store the processed knowledge base in memory for fast retrieval
faiss_index = None          # FAISS index for efficient similarity search
knowledge_chunks = []       # List of text chunks from CSV
chunk_metadata = []         # Metadata for each chunk (row info, source, etc.)

# ============================================================================
# DATA LOADING AND PREPROCESSING FUNCTIONS
# ============================================================================

def load_csv_from_s3(bucket: str, key: str) -> pd.DataFrame:
    """
    Load CSV file from S3 bucket and convert to pandas DataFrame.

    Process:
    1. Download CSV file from S3 as bytes
    2. Decode bytes to string
    3. Parse string as CSV into DataFrame

    Args:
        bucket: S3 bucket name
        key: Path to CSV file in bucket

    Returns:
        DataFrame containing CSV data
    """
    try:
        print(f"Downloading CSV from s3://{bucket}/{key}...")

        # Get the CSV file object from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)

        # Read the file content as bytes and decode to string
        csv_content = response['Body'].read().decode('utf-8')

        # Convert string to DataFrame using pandas
        # StringIO treats the string as a file-like object
        df = pd.read_csv(StringIO(csv_content))

        print(f"Successfully loaded CSV with {len(df)} rows and {len(df.columns)} columns")
        print(f"Columns: {list(df.columns)}")

        return df

    except Exception as e:
        print(f"Error loading CSV from S3: {str(e)}")
        raise

def preprocess_dataframe(df: pd.DataFrame) -> List[Dict]:
    """
    Convert DataFrame rows into text chunks suitable for retrieval.

    Data Treatment Process:
    1. Handle missing values (NaN) by replacing with empty strings
    2. Convert each row to a readable text format
    3. Create metadata for tracking source of information
    4. Split long texts into smaller chunks if needed

    Args:
        df: Input DataFrame from CSV

    Returns:
        List of dictionaries with 'text' and 'metadata' keys
    """
    chunks = []

    # Iterate through each row in the DataFrame
    for idx, row in df.iterrows():
        # Convert row to dictionary and handle NaN values
        # fillna('') replaces any missing values with empty string
        row_dict = row.to_dict()

        # Create a human-readable text representation of the row
        # This combines all column:value pairs into a single string
        text_parts = []
        for column, value in row_dict.items():
            # Skip empty values to keep text concise
            if pd.notna(value) and str(value).strip():
                text_parts.append(f"{column}: {value}")

        # Join all parts with newlines for readability
        full_text = "\n".join(text_parts)

        # Split into chunks if text is too long
        # This ensures each chunk fits within context limits
        if len(full_text) > CHUNK_SIZE:
            # Split long text into multiple chunks
            for i in range(0, len(full_text), CHUNK_SIZE):
                chunk_text = full_text[i:i + CHUNK_SIZE]
                chunks.append({
                    'text': chunk_text,
                    'metadata': {
                        'row_index': idx,
                        'chunk_index': i // CHUNK_SIZE,
                        'source': 'csv',
                        'columns': list(row_dict.keys())
                    }
                })
        else:
            # Add entire row as single chunk
            chunks.append({
                'text': full_text,
                'metadata': {
                    'row_index': idx,
                    'chunk_index': 0,
                    'source': 'csv',
                    'columns': list(row_dict.keys())
                }
            })

    print(f"Created {len(chunks)} text chunks from DataFrame")
    return chunks

def create_faiss_index(chunks: List[Dict]) -> Tuple[faiss.IndexFlatL2, List[str], List[Dict]]:
    """
    Create FAISS index for efficient similarity search.

    Embedding Process:
    1. Extract text from each chunk
    2. Convert text to embeddings (numerical vectors) using sentence transformer
    3. Create FAISS index to enable fast similarity search
    4. Add all embeddings to the index

    How embeddings work:
    - Similar texts have similar embeddings (vectors close in space)
    - FAISS can quickly find nearest neighbors (most similar texts)

    Args:
        chunks: List of text chunks with metadata

    Returns:
        Tuple of (FAISS index, list of texts, list of metadata)
    """
    print("Creating embeddings and FAISS index...")

    # Extract just the text from each chunk
    texts = [chunk['text'] for chunk in chunks]
    metadata = [chunk['metadata'] for chunk in chunks]

    # Generate embeddings for all texts
    # This converts each text into a vector (array of numbers)
    # Similar texts will have similar vectors
    embeddings = embedding_model.encode(
        texts,
        convert_to_numpy=True,      # Return as numpy array for FAISS
        show_progress_bar=True      # Show progress during encoding
    )

    # Get the dimension of embedding vectors (e.g., 384 for MiniLM)
    dimension = embeddings.shape[1]

    # Create FAISS index using L2 (Euclidean) distance
    # IndexFlatL2 does exact search (not approximate)
    index = faiss.IndexFlatL2(dimension)

    # Add all embeddings to the index
    # FAISS will use these to find similar vectors quickly
    index.add(embeddings.astype('float32'))

    print(f"FAISS index created with {index.ntotal} vectors of dimension {dimension}")

    return index, texts, metadata

def retrieve_relevant_chunks(query: str, top_k: int = TOP_K_RESULTS) -> List[Tuple[str, Dict, float]]:
    """
    Retrieve most relevant text chunks for a given query.

    Retrieval Process:
    1. Convert query to embedding (same vector space as knowledge base)
    2. Use FAISS to find k nearest neighbor embeddings
    3. Return corresponding text chunks with similarity scores

    Args:
        query: User's question or search query
        top_k: Number of most relevant chunks to return

    Returns:
        List of tuples (text, metadata, similarity_score)
    """
    global faiss_index, knowledge_chunks, chunk_metadata

    # Check if index is initialized
    if faiss_index is None:
        raise ValueError("FAISS index not initialized. Call initialize_rag_system() first.")

    # Convert query to embedding vector
    query_embedding = embedding_model.encode(
        [query],
        convert_to_numpy=True
    )

    # Search FAISS index for most similar vectors
    # Returns distances and indices of nearest neighbors
    # Lower distance = more similar
    distances, indices = faiss_index.search(
        query_embedding.astype('float32'),
        top_k
    )

    # Collect retrieved chunks with their metadata and scores
    results = []
    for distance, idx in zip(distances[0], indices[0]):
        results.append((
            knowledge_chunks[idx],           # The actual text
            chunk_metadata[idx],             # Metadata (row info, etc.)
            float(distance)                  # Similarity score (lower is better)
        ))

    return results

# ============================================================================
# RAG SYSTEM INITIALIZATION
# ============================================================================

def initialize_rag_system():
    """
    Initialize the RAG system by loading data and creating search index.

    Complete Pipeline:
    1. Load CSV from S3
    2. Preprocess into text chunks
    3. Generate embeddings
    4. Create FAISS index
    5. Store in global variables for fast access

    This runs once at startup to prepare the knowledge base.
    """
    global faiss_index, knowledge_chunks, chunk_metadata

    print("\n" + "="*70)
    print("INITIALIZING RAG SYSTEM")
    print("="*70)

    # Step 1: Load CSV from S3
    df = load_csv_from_s3(S3_BUCKET_NAME, S3_CSV_FILE_KEY)

    # Step 2: Preprocess DataFrame into chunks
    chunks = preprocess_dataframe(df)

    # Step 3: Create FAISS index and get embeddings
    faiss_index, knowledge_chunks, chunk_metadata = create_faiss_index(chunks)

    print("="*70)
    print("RAG SYSTEM INITIALIZED SUCCESSFULLY")
    print("="*70 + "\n")

# Initialize RAG system on startup
initialize_rag_system()

# ============================================================================
# PYDANTIC MODELS FOR API
# ============================================================================

class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    prompt: str                         # User's question
    max_new_tokens: int = 512          # Max tokens to generate
    temperature: float = 0.7           # Sampling temperature
    top_p: float = 0.9                 # Nucleus sampling threshold
    use_rag: bool = True               # Whether to use RAG (can disable for comparison)
    external_context: List[str] | None = None  # Optional externally provided curated chunks

class RAGResponse(BaseModel):
    """Response model including RAG context."""
    response: str                       # Model's answer
    answer_source: str                 # springboot | s3 | general_knowledge
    context_used: List[str]            # Retrieved chunks used
    sources: List[Dict]                # Metadata of sources

# ============================================================================
# CHAT ENDPOINT WITH RAG
# ============================================================================

@app.post("/chat", response_model=RAGResponse)
def chat(req: ChatRequest):
    """
    Chat endpoint with RAG integration.

    RAG Flow:
    1. Retrieve relevant context from knowledge base
    2. Inject context into prompt
    3. Generate response using LLaMA with enriched context
    4. Return response with sources

    Args:
        req: ChatRequest with user prompt and parameters

    Returns:
        RAGResponse with answer and context sources
    """

    context_used = []
    sources: List[Dict] = []
    answer_source = "general_knowledge"

    has_external = bool(req.external_context)
    if has_external:
        print(f"[chat] Received external_context from Spring Boot with {len(req.external_context)} items")

    # ------------------------------------------------------------------------
    # COMBINED CONTEXT: Use BOTH external context AND S3 retrieval
    # ------------------------------------------------------------------------
    
    # Step 1: Add external context from Spring Boot (real-time SQL data)
    if req.external_context:
        context_used.extend(req.external_context)
        sources.extend([{"source": "springboot", "row_index": None, "similarity_score": None, "columns": []} for _ in req.external_context])
        answer_source = "springboot"
        print(f"[source] Added springboot context: items={len(req.external_context)}")
    
    # Step 2: ALSO add S3 retrieval for additional medication info (always if use_rag is True)
    if req.use_rag:
        try:
            # Retrieve top-k most relevant chunks for the query
            retrieved_chunks = retrieve_relevant_chunks(req.prompt, top_k=TOP_K_RESULTS)

            # Extract context and metadata
            for text, metadata, score in retrieved_chunks:
                context_used.append(text)
                src_label = 's3' if metadata.get('source') == 'csv' else metadata.get('source') or 'unknown'
                sources.append({
                    "source": src_label,
                    "row_index": metadata.get('row_index'),
                    "similarity_score": score,
                    "columns": metadata.get('columns', [])
                })
            
            # Update answer_source to reflect combined sources
            if has_external and retrieved_chunks:
                answer_source = "springboot+s3"
                print(f"[source] Added s3 context: k={len(retrieved_chunks)} → Combined source: springboot+s3")
            elif retrieved_chunks:
                answer_source = "s3"
                print(f"[source] Using s3 context only: k={len(retrieved_chunks)}")
            
        except Exception as e:
            print(f"Error during S3 retrieval: {str(e)}")
            # Keep external context if available, just skip S3
            if not has_external:
                context_used = []
                sources = []
                answer_source = "general_knowledge"
                print("[source] Retrieval error and no external context; using general_knowledge")

    # ------------------------------------------------------------------------
    # AUGMENTATION PHASE: Combine retrieved context with user prompt
    # ------------------------------------------------------------------------

    # Build context section from retrieved chunks
    if context_used:
        # Format retrieved information into context block
        context_block = "\n\n".join([
            f"[Context {i+1}]\n{chunk}"
            for i, chunk in enumerate(context_used)
        ])

        # Enhanced system prompt that instructs model to use provided context
        system_message = """You are a pharmaceutical assistant specialized in Moroccan medications.
You have access to a database of medications with their indications, compositions, dosages, and prices.

IMPORTANT TRANSLATION RULES - Convert common language to medical terms:
- "mal à la tête" / "maux de tête" → search for "antalgique", "paracetamol", "ibuprofène", "céphalées"
- "fièvre" → search for "antipyrétique", "paracetamol"
- "toux" → search for "antitussif", "dextrométhorphane"
- "rhume" / "nez bouché" → search for "décongestionnant", "rhinite"
- "allergie" → search for "antihistaminique", "cétirizine", "desloratadine"
- "douleur" → search for "antalgique", "anti-inflammatoire", "AINS"
- "infection" → search for "antibiotique", "antiviral", "antifongique"
- "diabète" → search for "antidiabétique", "metformine", "insuline"
- "tension" / "hypertension" → search for "antihypertenseur"
- "estomac" / "brûlures" → search for "antiacide", "IPP", "oméprazole"
- "anxiété" / "stress" → search for "anxiolytique", "benzodiazépine"
- "dormir" / "insomnie" → search for "hypnotique", "troubles du sommeil"
- "enfant" → check "Age minimal d'utilisation" field

RESPONSE GUIDELINES:
1. Always provide the medication NAME, DOSAGE, and PRICE when available
2. Mention contraindications and age restrictions if present
3. For children, always check and mention age restrictions
4. If multiple options exist, list 2-3 alternatives
5. ALWAYS end with: "⚠️ Consultez un médecin ou pharmacien avant toute prise de médicament."

Use the provided context to answer accurately. If no relevant medication is found, say so clearly."""

        # Construct augmented prompt with context
        user_message = f"""Context from knowledge base:
{context_block}

User question: {req.prompt}

Please answer based on the context provided above."""

    else:
        # No RAG - use original system message
        system_message = "You are a cat that only says miaw."
        user_message = req.prompt

    # ------------------------------------------------------------------------
    # GENERATION PHASE: Format prompt for LLaMA
    # ------------------------------------------------------------------------

    # Format according to LLaMA 3.2 Instruct template
    formatted_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
{system_message}<|eot_id|><|start_header_id|>user<|end_header_id|>
{user_message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""

    # Tokenize the formatted prompt
    inputs = tokenizer(
        formatted_prompt,
        return_tensors="pt",
        add_special_tokens=False
    ).to(model.device)

    # Generate response using LLaMA model
    outputs = model.generate(
        **inputs,
        max_new_tokens=req.max_new_tokens,
        temperature=req.temperature,
        top_p=req.top_p,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id
    )

    # Decode the generated tokens to text
    full_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Extract only the assistant's new response
    prompt_length = len(tokenizer.decode(inputs['input_ids'][0], skip_special_tokens=True))
    assistant_reply = full_text[prompt_length:].strip()

    # ------------------------------------------------------------------------
    # RETURN RESPONSE WITH SOURCES
    # ------------------------------------------------------------------------

    if not sources:
        sources = [{"source": "general_knowledge"}]
        answer_source = "general_knowledge"
        print("[source] No context used; answer_source=general_knowledge")

    print(f"[chat] Completed; answer_source={answer_source}; context_items={len(context_used)}")
    return RAGResponse(
        response=assistant_reply,
        context_used=context_used,
        sources=sources,
        answer_source=answer_source,
    )

# ============================================================================
# ADDITIONAL ENDPOINTS
# ============================================================================

@app.post("/reload-knowledge-base")
def reload_knowledge_base():
    """
    Endpoint to reload the knowledge base from S3.
    Useful when CSV file is updated.
    """
    try:
        initialize_rag_system()
        return {"status": "success", "message": "Knowledge base reloaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/knowledge-base-stats")
def get_knowledge_base_stats():
    """
    Get statistics about the current knowledge base.
    """
    return {
        "total_chunks": len(knowledge_chunks),
        "embedding_dimension": faiss_index.d if faiss_index else None,
        "total_vectors": faiss_index.ntotal if faiss_index else None
    }

# ============================================================================
# STARTUP EVENT
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Run initialization tasks on application startup."""
    print("Application started successfully!")
    print(f"Knowledge base contains {len(knowledge_chunks)} chunks")

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)