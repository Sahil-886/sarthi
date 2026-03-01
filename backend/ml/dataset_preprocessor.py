import json
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatasetPreprocessor:
    """
    Scaffolding for preprocessing huggingface conversational emotional datasets
    like Counsel Chat and EmpatheticDialogues into a consistent JSONL format
    for Phase 2 DistilBERT fine-tuning and retrieval-augmented generation.
    """
    
    def __init__(self, output_dir: str = "./data/processed"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def format_counsel_chat(self, raw_data_path: str, output_filename: str = "counsel_chat.jsonl"):
        """
        Parses Counsel Chat CSV/JSON into a standard format:
        { "instruction": "User's message", "output": "Counselor's response", "emotion": "identified_emotion" }
        """
        logger.info(f"Preparing to parse Counsel Chat data from {raw_data_path}")
        output_path = self.output_dir / output_filename
        
        # In a real environment, you would use pandas to load the DataFrame
        # For boilerplate, we'll demonstrate the expected JSONL structure
        sample_data = [
            {
                "instruction": "I have been feeling really sad and hopeless lately. I can't sleep.",
                "output": "It sounds like you are going through a very difficult period. Have you spoken to a doctor about these symptoms?",
                "emotion": "sad"
            },
            {
                "instruction": "I'm so angry at my boss for passing me over for the promotion.",
                "output": "That sounds incredibly frustrating. It is completely normal to feel angry when your hard work isn't recognized.",
                "emotion": "angry"
            }
        ]
        
        with open(output_path, 'w', encoding='utf-8') as f:
            for item in sample_data:
                f.write(json.dumps(item) + '\n')
                
        logger.info(f"Successfully processed {len(sample_data)} records to {output_path}")
        
    def build_empathetic_dialogues(self, output_filename: str = "empathetic_dialogues.jsonl"):
        """
        Parses EmpatheticDialogues into a standard fine-tuning format.
        """
        logger.info("Preparing to parse EmpatheticDialogues data")
        output_path = self.output_dir / output_filename
        
        sample_data = [
            {
                "instruction": "I just got a new puppy and I'm so excited!",
                "output": "That's wonderful! Puppies bring so much joy. What breed is it?",
                "emotion": "happy"
            },
            {
                "instruction": "I failed my math test today.",
                "output": "I'm so sorry to hear that. Math can be really challenging. Don't be too hard on yourself.",
                "emotion": "sad"
            }
        ]
        
        with open(output_path, 'w', encoding='utf-8') as f:
            for item in sample_data:
                f.write(json.dumps(item) + '\n')
                
        logger.info(f"Successfully processed {len(sample_data)} records to {output_path}")

if __name__ == "__main__":
    preprocessor = DatasetPreprocessor()
    preprocessor.format_counsel_chat(raw_data_path="data/raw/counsel_chat.csv")
    preprocessor.build_empathetic_dialogues()
