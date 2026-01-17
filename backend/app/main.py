from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, HttpUrl
from supabase import create_client, Client
import httpx
from google import genai
from google.genai import types
import json
import os
from datetime import datetime

app = FastAPI(title="ScholarMap Agent", version="1.0.0")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
AGENT_SECRET = os.getenv("AGENT_SECRET")

# Initialize Gemini client
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def verify_token(authorization: str = Header(...)):
    if authorization != f"Bearer {AGENT_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")

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
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(str(url), follow_redirects=True)
        response.raise_for_status()
        return response.text[:50000]

def extract_with_gemini(content: str) -> dict:
    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"{EXTRACTION_PROMPT}\n\nWebpage content:\n{content}",
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    return json.loads(response.text)

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/ingest", response_model=IngestResponse, dependencies=[Depends(verify_token)])
async def ingest(request: IngestRequest):
    supabase = get_supabase()
    issues = []
    try:
        content = await fetch_page_content(str(request.url))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {e}")
    
    try:
        extracted = extract_with_gemini(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {e}")
    
    confidence = extracted.get("confidence_score", 0.5)
    issues.extend(extracted.get("issues", []))
    
    if confidence < 0.5:
        issues.append("Low confidence extraction - manual review recommended")
    
    program_data = {
        "name": extracted.get("name", "Unknown Program"),
        "provider": extracted.get("provider", "Unknown"),
        "level": extracted.get("level", "masters"),
        "funding_type": extracted.get("funding_type", "partial"),
        "countries_eligible": extracted.get("countries_eligible", []),
        "countries_of_study": extracted.get("countries_of_study", []),
        "fields": extracted.get("fields", []),
        "official_url": str(request.url),
        "description": extracted.get("description"),
        "who_wins": extracted.get("who_wins"),
        "rejection_reasons": extracted.get("rejection_reasons"),
        "status": "active",
        "last_verified_at": datetime.utcnow().isoformat()
    }
    
    if request.program_id:
        result = supabase.table("programs").update(program_data).eq("id", request.program_id).execute()
        program_id = request.program_id
        supabase.table("eligibility_rules").delete().eq("program_id", program_id).execute()
        supabase.table("requirements").delete().eq("program_id", program_id).execute()
        supabase.table("deadlines").delete().eq("program_id", program_id).execute()
    else:
        result = supabase.table("programs").insert(program_data).execute()
        program_id = result.data[0]["id"]
    
    for rule in extracted.get("eligibility_rules", []):
        supabase.table("eligibility_rules").insert({
            "program_id": program_id,
            "rule_type": rule.get("rule_type", "other"),
            "operator": rule.get("operator", "exists"),
            "value": rule.get("value", {}),
            "confidence": rule.get("confidence", "inferred"),
            "source_snippet": rule.get("source_snippet")
        }).execute()
    
    for req in extracted.get("requirements", []):
        supabase.table("requirements").insert({
            "program_id": program_id,
            "type": req.get("type", "other"),
            "description": req.get("description", ""),
            "mandatory": req.get("mandatory", True)
        }).execute()
    
    for deadline in extracted.get("deadlines", []):
        supabase.table("deadlines").insert({
            "program_id": program_id,
            "cycle": deadline.get("cycle", "2025/2026"),
            "deadline_date": deadline.get("deadline_date"),
            "stage": deadline.get("stage", "application")
        }).execute()
    
    supabase.table("sources").insert({
        "program_id": program_id,
        "url": str(request.url),
        "agent_model": "gemini-2.0-flash",
        "raw_summary": json.dumps(extracted)[:10000],
        "confidence_score": confidence
    }).execute()
    
    if issues:
        for issue in issues:
            supabase.table("agent_reviews").insert({
                "program_id": program_id,
                "issue_type": "suspicious" if confidence < 0.5 else "missing_data",
                "note": issue,
                "severity": "high" if confidence < 0.5 else "low"
            }).execute()
    
    return IngestResponse(success=True, program_id=program_id, confidence=confidence, issues=issues)

@app.post("/recheck", dependencies=[Depends(verify_token)])
async def recheck(program_id: str):
    supabase = get_supabase()
    program = supabase.table("programs").select("official_url").eq("id", program_id).single().execute()
    if not program.data:
        raise HTTPException(status_code=404, detail="Program not found")
    return await ingest(IngestRequest(url=program.data["official_url"], program_id=program_id))
