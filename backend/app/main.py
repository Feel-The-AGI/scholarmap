from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl, ValidationError
from supabase import create_client, Client
import httpx
from google import genai
from google.genai import types
import json
import os
import logging
import sys
import traceback
from datetime import datetime

# Configure logging - DEBUG level for maximum verbosity
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Log all environment variables (safely)
logger.debug("=== STARTUP CONFIGURATION ===")
logger.debug(f"SUPABASE_URL set: {bool(os.getenv('SUPABASE_URL'))}")
logger.debug(f"SUPABASE_SERVICE_KEY set: {bool(os.getenv('SUPABASE_SERVICE_KEY'))}")
logger.debug(f"GEMINI_API_KEY set: {bool(os.getenv('GEMINI_API_KEY'))}")
logger.debug(f"AGENT_SECRET set: {bool(os.getenv('AGENT_SECRET'))}")

app = FastAPI(title="ScholarMap Agent", version="1.0.0")

# Custom exception handler to log all errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"=== UNHANDLED EXCEPTION ===")
    logger.error(f"Path: {request.url.path}")
    logger.error(f"Method: {request.method}")
    logger.error(f"Exception type: {type(exc).__name__}")
    logger.error(f"Exception message: {str(exc)}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__}
    )

# Log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.debug(f"=== INCOMING REQUEST ===")
    logger.debug(f"Method: {request.method}")
    logger.debug(f"URL: {request.url}")
    logger.debug(f"Path: {request.url.path}")
    logger.debug(f"Headers: {dict(request.headers)}")
    
    # Try to read body for POST requests
    if request.method == "POST":
        try:
            body = await request.body()
            logger.debug(f"Raw body: {body.decode('utf-8', errors='replace')}")
            # Important: we need to re-set the body since we consumed it
            async def receive():
                return {"type": "http.request", "body": body}
            request._receive = receive
        except Exception as e:
            logger.error(f"Error reading body: {e}")
    
    response = await call_next(request)
    
    logger.debug(f"=== RESPONSE ===")
    logger.debug(f"Status code: {response.status_code}")
    
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://scholarmap.vercel.app",
        "https://frontend-tawny-ten-57.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
AGENT_SECRET = os.getenv("AGENT_SECRET")

# Initialize Gemini client
logger.debug("Initializing Gemini client...")
try:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    logger.debug("Gemini client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Gemini client: {e}")
    gemini_client = None

def get_supabase() -> Client:
    logger.debug("Creating Supabase client...")
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    logger.debug("Supabase client created")
    return client

def verify_token(authorization: str = Header(None)):
    logger.debug(f"=== TOKEN VERIFICATION ===")
    logger.debug(f"Authorization header received: {authorization is not None}")
    logger.debug(f"Authorization header value (first 20 chars): {authorization[:20] if authorization else 'None'}...")
    logger.debug(f"Expected token starts with: Bearer {AGENT_SECRET[:10] if AGENT_SECRET else 'NOT_SET'}...")
    
    if not authorization:
        logger.error("No authorization header provided")
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    expected = f"Bearer {AGENT_SECRET}"
    if authorization != expected:
        logger.error(f"Token mismatch!")
        logger.debug(f"Received length: {len(authorization)}, Expected length: {len(expected)}")
        raise HTTPException(status_code=401, detail="Unauthorized - token mismatch")
    
    logger.debug("Token verified successfully")

class IngestRequest(BaseModel):
    url: HttpUrl
    program_id: str | None = None

class IngestResponse(BaseModel):
    success: bool
    program_id: str | None = None
    confidence: float
    issues: list[str]

EXTRACTION_PROMPT = """You are analyzing a scholarship/fellowship program webpage. Extract structured data.

Return ONLY valid JSON with this exact structure:
{
  "name": "Program name",
  "provider": "Organization offering this",
  "level": "bachelor" | "masters" | "phd" | "postdoc",
  "funding_type": "full" | "partial" | "tuition_only" | "stipend_only",
  "countries_eligible": ["country1", "country2"],
  "countries_of_study": ["country1"],
  "fields": ["field1", "field2"],
  "description": "Brief description",
  "who_wins": "Profile of typical winners",
  "rejection_reasons": "Common reasons for rejection",
  "eligibility_rules": [
    {"rule_type": "gpa", "operator": ">=", "value": {"min": 3.0}, "confidence": "high", "source_snippet": "quote from page"},
    {"rule_type": "nationality", "operator": "in", "value": {"countries": ["Ghana", "Nigeria"]}, "confidence": "high", "source_snippet": "quote"}
  ],
  "requirements": [
    {"type": "transcript", "description": "Official transcripts", "mandatory": true},
    {"type": "essay", "description": "500-word personal statement", "mandatory": true}
  ],
  "deadlines": [
    {"cycle": "2025/2026", "deadline_date": "2025-11-15", "stage": "application"}
  ],
  "confidence_score": 0.85,
  "issues": ["Any concerns about data quality"]
}

Rules:
- level must be exactly: bachelor, masters, phd, or postdoc
- funding_type must be exactly: full, partial, tuition_only, or stipend_only
- rule_type must be: gpa, degree, nationality, age, work_experience, language, or other
- requirement type must be: transcript, cv, essay, references, proposal, test, interview, or other
- stage must be: application, interview, nomination, or result
- confidence must be: high, medium, or inferred
- confidence_score is 0-1 overall extraction confidence
- Include source_snippet for eligibility rules when possible

If information is not clearly stated, omit it or mark confidence as "inferred".
"""

async def fetch_page_content(url: str) -> str:
    logger.debug(f"Fetching page content from: {url}")
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(str(url), follow_redirects=True)
        logger.debug(f"HTTP response status: {response.status_code}")
        response.raise_for_status()
        content = response.text[:50000]
        logger.debug(f"Content length: {len(content)} chars")
        return content

def extract_with_gemini(content: str) -> dict:
    logger.debug("Starting Gemini extraction...")
    logger.debug(f"Content length for extraction: {len(content)}")
    
    if not gemini_client:
        raise Exception("Gemini client not initialized")
    
    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"{EXTRACTION_PROMPT}\n\nWebpage content:\n{content}",
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    logger.debug(f"Gemini response received, text length: {len(response.text)}")
    result = json.loads(response.text)
    logger.debug(f"JSON parsed successfully, keys: {result.keys()}")
    return result

@app.get("/health")
async def health():
    logger.debug("Health check requested")
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/ingest", response_model=IngestResponse)
async def ingest(request: Request, authorization: str = Header(None)):
    logger.debug("=== INGEST ENDPOINT CALLED ===")
    
    # Verify token first
    verify_token(authorization)
    
    # Parse body manually to get better error messages
    try:
        body = await request.body()
        logger.debug(f"Request body: {body.decode('utf-8')}")
        body_json = json.loads(body)
        logger.debug(f"Parsed JSON: {body_json}")
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")
    
    # Validate with Pydantic
    try:
        ingest_request = IngestRequest(**body_json)
        logger.debug(f"Pydantic validation passed. URL: {ingest_request.url}")
    except ValidationError as e:
        logger.error(f"Pydantic validation error: {e}")
        raise HTTPException(status_code=400, detail=f"Validation error: {e.errors()}")
    
    supabase = get_supabase()
    issues = []
    
    # Fetch page
    try:
        logger.debug(f"Fetching URL: {ingest_request.url}")
        content = await fetch_page_content(str(ingest_request.url))
        logger.debug(f"Page fetched, content length: {len(content)}")
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching URL: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: HTTP {e.response.status_code}")
    except Exception as e:
        logger.error(f"Error fetching URL: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {e}")
    
    # Extract with Gemini
    try:
        logger.debug("Starting Gemini extraction...")
        extracted = extract_with_gemini(content)
        logger.debug(f"Extraction complete. Keys: {list(extracted.keys())}")
        logger.debug(f"Extracted name: {extracted.get('name')}")
        logger.debug(f"Extracted provider: {extracted.get('provider')}")
        logger.debug(f"Extracted level: {extracted.get('level')}")
        logger.debug(f"Full extraction result: {json.dumps(extracted, indent=2)[:2000]}")
    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Extraction failed: {e}")
    
    confidence = extracted.get("confidence_score", 0.5)
    issues.extend(extracted.get("issues", []))
    
    if confidence < 0.5:
        issues.append("Low confidence extraction - manual review recommended")
    
    program_data = {
        "name": extracted.get("name") or "Unknown Program",
        "provider": extracted.get("provider") or "Unknown",
        "level": extracted.get("level") or "masters",
        "funding_type": extracted.get("funding_type") or "partial",
        "countries_eligible": extracted.get("countries_eligible") or [],
        "countries_of_study": extracted.get("countries_of_study") or [],
        "fields": extracted.get("fields") or [],
        "official_url": str(ingest_request.url),
        "description": extracted.get("description"),
        "who_wins": extracted.get("who_wins"),
        "rejection_reasons": extracted.get("rejection_reasons"),
        "status": "active",
        "last_verified_at": datetime.utcnow().isoformat()
    }
    
    logger.debug(f"Program data prepared: {program_data['name']}")
    
    try:
        if ingest_request.program_id:
            logger.debug(f"Updating existing program: {ingest_request.program_id}")
            result = supabase.table("programs").update(program_data).eq("id", ingest_request.program_id).execute()
            program_id = ingest_request.program_id
            supabase.table("eligibility_rules").delete().eq("program_id", program_id).execute()
            supabase.table("requirements").delete().eq("program_id", program_id).execute()
            supabase.table("deadlines").delete().eq("program_id", program_id).execute()
        else:
            logger.debug("Inserting new program...")
            result = supabase.table("programs").insert(program_data).execute()
            program_id = result.data[0]["id"]
            logger.debug(f"New program created with ID: {program_id}")
        
        # Insert eligibility rules
        for rule in extracted.get("eligibility_rules", []):
            logger.debug(f"Inserting eligibility rule: {rule.get('rule_type')}")
            supabase.table("eligibility_rules").insert({
                "program_id": program_id,
                "rule_type": rule.get("rule_type", "other"),
                "operator": rule.get("operator", "exists"),
                "value": rule.get("value", {}),
                "confidence": rule.get("confidence", "inferred"),
                "source_snippet": rule.get("source_snippet")
            }).execute()
        
        # Insert requirements
        for req in extracted.get("requirements", []):
            logger.debug(f"Inserting requirement: {req.get('type')}")
            supabase.table("requirements").insert({
                "program_id": program_id,
                "type": req.get("type", "other"),
                "description": req.get("description", ""),
                "mandatory": req.get("mandatory", True)
            }).execute()
        
        # Insert deadlines
        for deadline in extracted.get("deadlines", []):
            logger.debug(f"Inserting deadline: {deadline.get('stage')}")
            supabase.table("deadlines").insert({
                "program_id": program_id,
                "cycle": deadline.get("cycle", "2025/2026"),
                "deadline_date": deadline.get("deadline_date"),
                "stage": deadline.get("stage", "application")
            }).execute()
        
        # Insert source
        logger.debug("Inserting source record...")
        supabase.table("sources").insert({
            "program_id": program_id,
            "url": str(ingest_request.url),
            "agent_model": "gemini-2.5-flash",
            "raw_summary": json.dumps(extracted)[:10000],
            "confidence_score": confidence
        }).execute()
        
        # Insert reviews if any issues
        if issues:
            for issue in issues:
                logger.debug(f"Inserting review: {issue}")
                supabase.table("agent_reviews").insert({
                    "program_id": program_id,
                    "issue_type": "suspicious" if confidence < 0.5 else "missing_data",
                    "note": issue,
                    "severity": "high" if confidence < 0.5 else "low"
                }).execute()
        
    except Exception as e:
        logger.error(f"Database error: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    
    logger.debug(f"=== INGEST COMPLETE ===")
    logger.debug(f"Program ID: {program_id}, Confidence: {confidence}, Issues: {issues}")
    
    return IngestResponse(success=True, program_id=program_id, confidence=confidence, issues=issues)

@app.post("/recheck")
async def recheck(program_id: str, authorization: str = Header(None)):
    logger.debug(f"Recheck requested for program: {program_id}")
    verify_token(authorization)
    
    supabase = get_supabase()
    program = supabase.table("programs").select("official_url").eq("id", program_id).single().execute()
    if not program.data:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Create a mock request for the ingest function
    from fastapi import Request as FastAPIRequest
    # This is a bit hacky but works for recheck
    return {"message": "Use /ingest endpoint directly with program_id parameter"}

logger.debug("=== APPLICATION STARTUP COMPLETE ===")
