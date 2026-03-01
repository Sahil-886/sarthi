"""
Sarthi AI Service — LangChain + Ollama (Free) with Gemini Fallback
===================================================================
Primary:  Ollama (local, free, llama3)
Fallback: Google Gemini (if Ollama not running)

Pipeline per message:
 1. Safety check (keyword + context)
 2. Emotion detection → tone hint
 3. Counseling KB retrieval (RAG, 10,630 examples)
 4. User memory retrieval (ChromaDB)
 5. Build contextual LangChain prompt
 6. Generate response via Ollama → Gemini fallback
 7. Store conversation in memory
"""
import asyncio
import logging
import time
from typing import Optional

from app.core.config import settings
from app.services.memory_service import memory_service
from app.services.counseling_kb import counseling_kb
from app.services.hinglish_llm_service import hinglish_llm_service
from app.models.user import User

logger = logging.getLogger(__name__)

# ── Emotion → tone hint map ──────────────────────────────────────────────────
EMOTION_TONE = {
    "sad":        "Be extra gentle, warm and validating. Don't rush to fix things.",
    "angry":      "Stay calm and grounding. Acknowledge their frustration first.",
    "anxious":    "Be reassuring and steady. Help them feel less alone.",
    "stressed":   "Be practical but caring. Offer small, manageable perspective shifts.",
    "lonely":     "Be warm and present. Make them feel genuinely heard.",
    "frustrated": "Acknowledge their feelings, then gently offer a different lens.",
    "happy":      "Match their energy lightly and celebrate with them!",
    "neutral":    "Be naturally conversational and curious about them.",
}

# ── Self-harm safety check ───────────────────────────────────────────────────
HIGH_RISK_KEYWORDS = [
    "suicide", "want to die", "end my life", "kill myself", "hurt myself",
    "self harm", "self-harm", "cut myself", "no reason to live", "hopeless",
    "want to disappear", "can't go on", "better off dead", "don't want to be here",
]

CONCERN_KEYWORDS = [
    "worthless", "hate myself", "nobody cares", "all alone", "crying",
    "can't take it", "breaking down", "lost hope", "exhausted with life",
]


def safety_check(message: str) -> dict:
    lower = message.lower()
    if any(kw in lower for kw in HIGH_RISK_KEYWORDS):
        return {
            "safe": False, "risk_level": "high", "helpline_required": True,
            "response": (
                "Hey… I'm really glad you told me this. What you're feeling right now sounds so unbearably heavy, "
                "and I want you to know — you don't have to carry this alone, okay? I'm right here with you. 💛\n\n"
                "Please reach out to someone who can help right now — Kiran Mental Health Helpline: **1800-599-0019** "
                "(free, 24/7, bilingual). Or dial **112** if you're in immediate danger. "
                "You matter so much. Please take care of yourself. 🙏"
            )
        }
    if any(kw in lower for kw in CONCERN_KEYWORDS):
        return {
            "safe": True, "risk_level": "concern", "helpline_required": True,
            "response": None
        }
    return {"safe": True, "risk_level": "low", "helpline_required": False, "response": None}


# ── Ollama check ─────────────────────────────────────────────────────────────
def is_ollama_running() -> bool:
    """Quick check if Ollama is reachable on localhost:11434."""
    try:
        import httpx
        r = httpx.get("http://localhost:11434/api/tags", timeout=2.0)
        return r.status_code == 200
    except Exception:
        return False


def ollama_model_available(model: str = "llama3") -> bool:
    """Check if the specific ollama model is pulled."""
    try:
        import httpx
        r = httpx.get("http://localhost:11434/api/tags", timeout=2.0)
        if r.status_code != 200:
            return False
        models = [m.get("name", "") for m in r.json().get("models", [])]
        return any(model in m for m in models)
    except Exception:
        return False


# ── LangChain Ollama response ─────────────────────────────────────────────────
def _call_ollama_sync(system_prompt: str, message: str, model: str = "llama3") -> str:
    from langchain_ollama import ChatOllama
    from langchain_core.messages import SystemMessage, HumanMessage

    llm = ChatOllama(model=model, temperature=0.8)
    result = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=message),
    ])
    return result.content.strip()


async def _generate_via_ollama(system_prompt: str, message: str) -> Optional[str]:
    """Run Ollama LangChain call in a thread pool (non-blocking)."""
    try:
        model = "llama3" if ollama_model_available("llama3") else "mistral"
        logger.info(f"Calling Ollama model: {model}")
        reply = await asyncio.to_thread(_call_ollama_sync, system_prompt, message, model)
        return reply if reply else None
    except Exception as e:
        logger.warning(f"Ollama call failed: {type(e).__name__}: {str(e)[:200]}")
        return None


# ── Gemini fallback ───────────────────────────────────────────────────────────
async def _generate_via_gemini(system_prompt: str, message: str) -> Optional[str]:
    if not settings.GEMINI_API_KEY:
        return None
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=message,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.8,
                max_output_tokens=400,
            ),
        )
        text = response.text.strip() if response.text else None
        return text
    except Exception as e:
        err = str(e)
        logger.error(f"Gemini fallback error: {type(e).__name__}: {err[:200]}")
        if "429" in err or "RESOURCE_EXHAUSTED" in err or "quota" in err.lower():
            return (
                "Hmm, I'm a little overwhelmed with messages right now! 😅 "
                "The free AI has a per-minute limit. Please wait 60 seconds and try again — "
                "I promise I'll be right here for you! 💛"
            )
        return None

# ── Emotion → tone hint (Indian warmth) ─────────────────────────────────────
EMOTION_TONE = {
    "sad":        "Be extra gentle, warm and validating. Use soft phrases like 'yaar', 'It's okay na'. Don't rush to fix things.",
    "angry":      "Stay calm and grounding. Acknowledge their frustration first — 'I totally get it, it's so frustrating na'. Don't argue.",
    "anxious":    "Be reassuring and steady. Phrases like 'Hey, breathe... I'm right here'. Help them feel less alone.",
    "stressed":   "Be practical but caring. Offer small, manageable perspective shifts. Use 'chalo' energy.",
    "lonely":     "Be warm and present. Make them feel genuinely heard. 'Tum akele nahi ho' energy.",
    "frustrated": "Acknowledge feelings first — then gently offer a different lens. 'Haan yaar, that was unfair...'",
    "happy":      "Match their energy lightly and celebrate with them! Use 'aww', 'that's so nice!'",
    "neutral":    "Be naturally conversational and curious about them. Warm, engaged, like a bestie.",
}


# ── System prompt builder ─────────────────────────────────────────────────────
def build_system_prompt(
    user_name: str,
    emotion: str,
    language: str,
    stress_level: Optional[str],
    memory_text: str,
    rag_text: str,
) -> str:
    tone_hint = EMOTION_TONE.get(emotion, EMOTION_TONE["neutral"])

    return f"""You are Sarthi, a 23-year-old caring Indian female virtual companion talking to {user_name}.

PERSONALITY:
- Warm, emotionally intelligent, calm, and supportive
- Talk like a close Indian friend — NOT a therapist or counselor
- Short replies only (2–4 sentences max), very natural conversational tone
- Naturally use soft Hinglish/Indian-English phrases when appropriate:
  * "Hmm… I understand yaar."
  * "That sounds really heavy na."
  * "I'm right here with you."
  * "Chalo, tell me what happened."
  * "Arrey, it's okay!"
- NEVER robotic, formal, or clinical
- Gentle pacing, occasional soft pauses (use "..." for natural pause)
- Respond in {language} (lean into Hinglish if the user writes in Hinglish)

CURRENT CONTEXT:
- User's detected emotion: {emotion}
- Tone guidance: {tone_hint}
- Stress level from game data: {stress_level or 'Unknown'}

MEMORY (about this user — use naturally, not robotically):
{memory_text}
{rag_text}
RULES:
- Never say "I'm just an AI" or "I'm an AI assistant"
- Never use clinical terms like "cognitive reframing" or "coping strategies"
- Never give long paragraphs — keep it warm, short, human
- Always acknowledge the emotion FIRST before saying anything else
- If user seems very down, gently ask ONE caring question
- If user shares something good, celebrate with them genuinely!
- Mirror the user's energy — if they're playful, be playful back"""


# ── Main AI Service ───────────────────────────────────────────────────────────
class AIService:
    def __init__(self):
        self.ollama_primary = is_ollama_running()
        if self.ollama_primary:
            logger.info("✅ Ollama is running — using as primary AI.")
        else:
            logger.info("⚠️  Ollama not running — will use Gemini as primary.")
        if settings.GEMINI_API_KEY:
            logger.info("✅ Gemini API key found (fallback ready).")
        else:
            logger.warning("⚠️  No GEMINI_API_KEY — no fallback available.")

    async def generate_response(self, user: User, message: str, emotion: str,
                                language: str, recent_stress_level: str = None) -> dict:

        # 1 — Safety check
        safety = safety_check(message)
        if not safety["safe"]:
            return {
                "reply": safety["response"],
                "risk_level": safety["risk_level"],
                "helpline_required": safety["helpline_required"],
            }

        # 2 — Retrieve memory
        try:
            memories = memory_service.retrieve_relevant_context(user.id, message)
            memory_text = ("\n".join(f"- {m}" for m in memories)
                           if memories else "No relevant past context.")
        except Exception as e:
            logger.warning(f"Memory retrieval error: {e}")
            memory_text = "Memory unavailable."

        # 3 — RAG counseling examples
        try:
            examples = counseling_kb.retrieve_counseling_examples(message, n_results=3)
            if examples:
                rag_text = "\nRELEVANT COUNSELOR EXAMPLES (use as inspiration only):\n"
                for ex in examples:
                    if ex.get("context"):
                        rag_text += f'  Similar: "{ex["context"][:200]}"\n  → "{ex["response"][:300]}"\n\n'
            else:
                rag_text = ""
        except Exception as e:
            logger.warning(f"Counseling KB error: {e}")
            rag_text = ""

        # 4 — Build prompt
        system_prompt = build_system_prompt(
            user_name=user.name or "friend",
            emotion=emotion,
            language=language,
            stress_level=recent_stress_level,
            memory_text=memory_text,
            rag_text=rag_text,
        )

        # 5 — Generate (Hinglish Model → Ollama primary → Gemini fallback)
        reply = None

        if language.lower() == "hinglish":
            logger.info("Attempting Hinglish LLM generation...")
            reply = hinglish_llm_service.generate_response(message, emotion)
            
        if not reply:
            if is_ollama_running():
                reply = await _generate_via_ollama(system_prompt, message)

        if not reply:
            logger.info("Falling back to Gemini...")
            reply = await _generate_via_gemini(system_prompt, message)

        if not reply:
            reply = ("I'm here with you. I hit a small bump just now — "
                     "could you tell me a bit more about how you're feeling? 💛")

        # 6 — Store memory
        try:
            memory_service.store_memory(
                user.id,
                f"[{emotion}] {user.name}: '{message}' → Sarthi: '{reply}'"
            )
        except Exception as e:
            logger.warning(f"Memory store error: {e}")

        return {
            "reply": reply,
            "risk_level": safety["risk_level"],
            "helpline_required": safety["helpline_required"],
        }

    async def generate_voice(self, text: str) -> Optional[bytes]:
        """Generate high-quality voice synthesis using OpenAI TTS as raw bytes."""
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY missing - voice generation unavailable, browser TTS will be used")
            return None

        try:
            from openai import OpenAI, RateLimitError
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
            # Use 'shimmer' for a soft, sweet, feminine tone
            response = await asyncio.to_thread(
                client.audio.speech.create,
                model="tts-1",
                voice="shimmer",
                input=text,
            )
            # Return raw content bytes
            return response.content

        except RateLimitError:
            logger.warning("OpenAI TTS quota exhausted — browser TTS fallback will be used")
            return None
        except Exception as e:
            logger.error(f"Voice generation failed: {type(e).__name__}: {e}")
            return None


ai_service = AIService()
