import logging
from transformers import pipeline
import torch

logger = logging.getLogger(__name__)

class EmotionService:
    def __init__(self):
        # Determine device implicitly. MPS (Metal) on Mac, CUDA on NV, else CPU.
        if torch.backends.mps.is_available():
            self.device = "mps"
        elif torch.cuda.is_available():
            self.device = 0
        else:
            self.device = -1
            
        try:
            logger.info("Loading DistilBERT emotion classifier...")
            self.classifier = pipeline(
                "text-classification", 
                model="j-hartmann/emotion-english-distilroberta-base", 
                device=self.device
            )
            logger.info("Emotion classifier loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load emotion model: {e}")
            self.classifier = None

    def detect_emotion(self, text: str) -> dict:
        if not self.classifier:
            return {"emotion": "neutral", "confidence": 0.5}
            
        try:
            # The model returns labels: anger, disgust, fear, joy, neutral, sadness, surprise
            # Pipeline output format: [{'label': 'joy', 'score': 0.99}]
            result = self.classifier(text, truncation=True, max_length=512)[0]
            label = result['label']
            score = result['score']
            
            # Map to required emotions: happy, sad, angry, anxious, stressed, neutral, lonely, frustrated
            emotion_map = {
                "joy": "happy",
                "sadness": "sad",
                "anger": "angry",
                "fear": "anxious",
                "neutral": "neutral",
                "surprise": "neutral",
                "disgust": "frustrated"
            }
            mapped_emotion = emotion_map.get(label.lower(), "neutral")
            
            return {
                "emotion": mapped_emotion,
                "confidence": round(float(score), 4)
            }
        except Exception as e:
            logger.error(f"Error in emotion detection: {e}")
            return {"emotion": "neutral", "confidence": 0.0}

emotion_service = EmotionService()
