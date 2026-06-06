from fastapi import APIRouter
from pydantic import BaseModel

# ── Router ───────────────────────────────────────────────────────────────────
router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class DetectRequest(BaseModel):
    text: str

class DetectResponse(BaseModel):
    lang:       str
    confidence: float


# ── Core logic ────────────────────────────────────────────────────────────────

def detect_language(text: str) -> dict:
    """
    English-only project — always returns 'en'.
    Kept as a module so it can be swapped back to multilingual later.
    """
    if not text or not text.strip():
        return {"lang": "unknown", "confidence": 0.0}
    return {"lang": "en", "confidence": 1.0}


def get_lang_code(text: str) -> str:
    return detect_language(text)["lang"]


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/detect-language", response_model=DetectResponse)
async def detect_language_endpoint(body: DetectRequest):
    result = detect_language(body.text)
    return DetectResponse(**result)
