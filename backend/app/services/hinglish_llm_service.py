import logging
import torch
import os
from transformers import AutoTokenizer, AutoModelForCausalLM
from typing import Optional

logger = logging.getLogger(__name__)

class HinglishLLMService:
    """
    Service to handle inference for the fine-tuned Hinglish LLM.
    Supports both local development (CPU/MPS) and production (CUDA).
    """
    
    def __init__(self, model_path: str = "./training/sarthi_model"):
        self.model_path = model_path
        self.tokenizer = None
        self.model = None
        self.is_loaded = False
        
    def load_model(self):
        """Lazy load the model to save memory during startup."""
        if self.is_loaded:
            return
            
        if not os.path.exists(self.model_path):
            logger.warning(f"Hinglish model not found at {self.model_path}. Hinglish features will be limited.")
            return

        try:
            from peft import PeftModel
            BASE_MODEL = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
            
            logger.info(f"Loading Base Model: {BASE_MODEL}...")
            self.tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
            
            # Determine device and dtype
            if torch.cuda.is_available():
                device_map = "auto"
                dtype = torch.float16
            elif torch.backends.mps.is_available():
                device_map = "auto"
                dtype = torch.float16 # MPS supports float16 well
            else:
                device_map = "cpu"
                dtype = torch.float32
                
            base_model = AutoModelForCausalLM.from_pretrained(
                BASE_MODEL,
                device_map=device_map,
                torch_dtype=dtype
            )
            
            logger.info(f"Loading Peft Adapter from {self.model_path}...")
            # If model_path is a directory without config but with checkpoints, try latest checkpoint
            adapter_path = self.model_path
            if not os.path.exists(os.path.join(adapter_path, "adapter_config.json")):
                # Search for checkpoints
                checkpoints = [d for d in os.listdir(adapter_path) if d.startswith("checkpoint-")]
                if checkpoints:
                    latest_cp = sorted(checkpoints, key=lambda x: int(x.split("-")[-1]))[-1]
                    adapter_path = os.path.join(adapter_path, latest_cp)
                    logger.info(f"Using latest checkpoint: {adapter_path}")

            self.model = PeftModel.from_pretrained(base_model, adapter_path)
            self.is_loaded = True
            logger.info("Hinglish LLM (PEFT) loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Hinglish LLM: {type(e).__name__}: {e}")
            self.is_loaded = False

    def generate_response(self, message: str, emotion: str = "neutral") -> Optional[str]:
        if not self.is_loaded:
            self.load_model()
            
        if not self.is_loaded:
            return None
            
        try:
            prompt = f"User: {message}\nAssistant:"
            inputs = self.tokenizer(prompt, return_tensors="pt")
            
            # Move to correct device
            if torch.cuda.is_available():
                inputs = {k: v.to("cuda") for k, v in inputs.items()}
            elif torch.backends.mps.is_available():
                inputs = {k: v.to("mps") for k, v in inputs.items()}

            with torch.no_grad():
                output = self.model.generate(
                    **inputs,
                    max_new_tokens=150,
                    temperature=0.7,
                    do_sample=True,
                    top_p=0.9
                )

            response = self.tokenizer.decode(output[0], skip_special_tokens=True)
            
            # Extract only the assistant's part
            if "Assistant:" in response:
                response = response.split("Assistant:")[-1].strip()
            return response
        except Exception as e:
            logger.error(f"Error generating Hinglish response: {e}")
            return None

hinglish_llm_service = HinglishLLMService()
