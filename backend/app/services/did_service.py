"""
D-ID Avatar Service (Upgraded)
================================
Properly handles D-ID's asynchronous video generation:
  1. POST /talks → get talk_id (status: "created")
  2. Poll GET /talks/{id} every 2s until status = "done"
  3. Return result_url (CDN video URL)

API Key format: Basic base64(email:key)
"""
import os
import time
import logging
import requests
from typing import Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class DIDAPIClient:
    """D-ID talking avatar client with proper async polling."""

    AVATAR_URL = "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/v1_image.jpeg"
    VOICE_ID   = "en-US-JennyNeural"   # friendly, warm female voice
    MAX_CHARS  = 500                   # keep videos short < ~30s

    def __init__(self):
        raw_key = os.getenv("DID_API_KEY", "")
        self.api_key   = raw_key
        self.base_url  = "https://api.d-id.com"
        self.headers = {
            "Authorization": f"Basic {raw_key}",
            "Content-Type":  "application/json",
            "Accept":        "application/json",
        }

    # ── 1. Submit talk ─────────────────────────────────────────────────────────
    def _submit_talk(self, text: str) -> Optional[str]:
        """Submit a /talks request, returns talk_id or None."""
        text = text[:self.MAX_CHARS]   # truncate for speed
        payload = {
            "source_url": self.AVATAR_URL,
            "script": {
                "type":     "text",
                "input":    text,
                "provider": {
                    "type":     "microsoft",
                    "voice_id": self.VOICE_ID,
                },
            },
            "config": {
                "fluent":         True,
                "pad_audio":      0.0,
                "stitch":         True,
            },
        }
        try:
            r = requests.post(f"{self.base_url}/talks", json=payload, headers=self.headers, timeout=20)
            if r.status_code in (200, 201):
                talk_id = r.json().get("id")
                logger.info(f"D-ID talk submitted: id={talk_id}")
                return talk_id
            logger.error(f"D-ID submit failed: {r.status_code} {r.text[:200]}")
            return None
        except Exception as e:
            logger.error(f"D-ID submit exception: {e}")
            return None

    # ── 2. Poll for completion ─────────────────────────────────────────────────
    def _poll_for_video(self, talk_id: str, max_wait: int = 90) -> Optional[str]:
        """Poll GET /talks/{id} until done or timeout. Returns result_url."""
        deadline = time.time() + max_wait
        while time.time() < deadline:
            try:
                r = requests.get(f"{self.base_url}/talks/{talk_id}", headers=self.headers, timeout=10)
                if r.status_code == 200:
                    data   = r.json()
                    status = data.get("status")
                    if status == "done":
                        url = data.get("result_url")
                        logger.info(f"D-ID video ready: {url}")
                        return url
                    if status in ("error", "rejected"):
                        logger.error(f"D-ID talk failed: {data}")
                        return None
                    logger.info(f"D-ID status: {status}, waiting…")
                else:
                    logger.warning(f"D-ID poll {r.status_code}: {r.text[:100]}")
            except Exception as e:
                logger.warning(f"D-ID poll exception: {e}")
            time.sleep(2.5)
        logger.error("D-ID poll timed out")
        return None

    # ── 3. Public helper ───────────────────────────────────────────────────────
    def create_avatar_video(self, text: str) -> Optional[str]:
        """Full flow: submit + poll → return video URL or None."""
        if not self.api_key:
            logger.warning("DID_API_KEY not set — avatar disabled")
            return None
        talk_id = self._submit_talk(text)
        if not talk_id:
            return None
        return self._poll_for_video(talk_id)

    # Legacy helpers kept for backward compat
    def generate_avatar_video(self, text: str, source_url: str = None, voice_id: str = None) -> Optional[dict]:
        video_url = self.create_avatar_video(text)
        if video_url:
            return {"result_url": video_url, "status": "done"}
        return None

    def get_talk_status(self, talk_id: str) -> Optional[dict]:
        try:
            r = requests.get(f"{self.base_url}/talks/{talk_id}", headers=self.headers, timeout=10)
            return r.json() if r.status_code == 200 else None
        except Exception:
            return None

    def get_avatar_url(self, talk_id: str) -> Optional[str]:
        result = self.get_talk_status(talk_id)
        return result.get("result_url") if result else None


# Singleton
_did_client: Optional[DIDAPIClient] = None

def get_did_client() -> DIDAPIClient:
    global _did_client
    if _did_client is None:
        _did_client = DIDAPIClient()
    return _did_client
